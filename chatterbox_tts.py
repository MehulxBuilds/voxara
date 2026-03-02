"""Chatterbox TTS API - Text-to-speech with voice cloning on Modal."""

import modal

# Create the UploadThing secret (one-time):
# modal secret create uploadthing-token UPLOADTHING_TOKEN=<your-token>

# Use this to test locally:
# modal run chatterbox_tts.py \
#   --prompt "Hello from Chatterbox [chuckle]." \
#   --voice-key "<uploadthing-file-key>"

# Use this to test CURL:
# curl -X POST "https://<your-modal-endpoint>/generate" \
#   -H "Content-Type: application/json" \
#   -H "X-Api-Key: <your-api-key>" \
#   -d '{"prompt": "Hello from Chatterbox [chuckle].", "voice_key": "<uploadthing-file-key>"}' \
#   --output output.wav

VOICE_CACHE_DIR = "/tmp/voice-cache"

# Modal setup
image = modal.Image.debian_slim(python_version="3.10").uv_pip_install(
    "chatterbox-tts==0.1.6",
    "fastapi[standard]==0.124.4",
    "peft==0.18.0",
    "httpx==0.28.1",
)
app = modal.App("chatterbox-tts", image=image)

with image.imports():
    import base64
    import hashlib
    import hmac
    import io
    import json
    import os
    import time
    from pathlib import Path

    import httpx
    import torchaudio as ta
    from chatterbox.tts_turbo import ChatterboxTurboTTS
    from fastapi import (
        Depends,
        FastAPI,
        HTTPException,
        Security,
    )
    from fastapi.middleware.cors import CORSMiddleware
    from fastapi.responses import StreamingResponse
    from fastapi.security import APIKeyHeader
    from pydantic import BaseModel, Field

    api_key_scheme = APIKeyHeader(
        name="x-api-key",
        scheme_name="ApiKeyAuth",
        auto_error=False,
    )

    def verify_api_key(x_api_key: str | None = Security(api_key_scheme)):
        expected = os.environ.get("CHATTERBOX_API_KEY", "")
        if not expected or x_api_key != expected:
            raise HTTPException(status_code=403, detail="Invalid API key")
        return x_api_key

    class TTSRequest(BaseModel):
        """Request model for text-to-speech generation."""

        prompt: str = Field(..., min_length=1, max_length=5000)
        voice_key: str = Field(..., min_length=1, max_length=300)
        temperature: float = Field(default=0.8, ge=0.0, le=2.0)
        top_p: float = Field(default=0.95, ge=0.0, le=1.0)
        top_k: int = Field(default=1000, ge=1, le=10000)
        repetition_penalty: float = Field(default=1.2, ge=1.0, le=2.0)
        norm_loudness: bool = Field(default=True)

    def _parse_ut_token() -> tuple[str, str]:
        """Return (app_id, api_key) from the UPLOADTHING_TOKEN env var."""
        token = os.environ.get("UPLOADTHING_TOKEN", "")
        if not token:
            raise RuntimeError("UPLOADTHING_TOKEN environment variable is not set")
        token = token.strip().strip("'\"")
        decoded = json.loads(base64.b64decode(token))
        return decoded["appId"], decoded["apiKey"]

    def _signed_ut_url(voice_key: str) -> str:
        """Build an HMAC-signed UploadThing URL for private file access."""
        app_id, api_key = _parse_ut_token()
        base_url = f"https://{app_id}.ufs.sh/f/{voice_key}"
        expires = int(time.time() * 1000) + 60_000  # valid for 60 seconds
        url_with_expires = f"{base_url}?expires={expires}"
        sig = hmac.new(
            api_key.encode(), url_with_expires.encode(), hashlib.sha256
        ).hexdigest()
        return f"{url_with_expires}&signature=hmac-sha256={sig}"

    def download_voice(voice_key: str) -> str:
        """Download a voice file from UploadThing, returning a cached local path."""
        cache_dir = Path(VOICE_CACHE_DIR)
        cache_dir.mkdir(parents=True, exist_ok=True)

        safe_name = hashlib.sha256(voice_key.encode()).hexdigest() + ".wav"
        cached_path = cache_dir / safe_name

        if cached_path.exists():
            return str(cached_path)

        url = _signed_ut_url(voice_key)
        with httpx.Client(timeout=30) as client:
            resp = client.get(url, follow_redirects=True)
            if resp.status_code != 200:
                raise HTTPException(
                    status_code=400,
                    detail=f"Failed to download voice '{voice_key}' from UploadThing (HTTP {resp.status_code})",
                )
            cached_path.write_bytes(resp.content)

        return str(cached_path)


@app.cls(
    gpu="a10g",
    scaledown_window=60 * 5,
    secrets=[
        modal.Secret.from_name("hf-token"),
        modal.Secret.from_name("chatterbox-api-key"),
        modal.Secret.from_name("uploadthing-token"),
    ],
)
@modal.concurrent(max_inputs=10)
class Chatterbox:
    @modal.enter()
    def load_model(self):
        self.model = ChatterboxTurboTTS.from_pretrained(device="cuda")

    @modal.asgi_app()
    def serve(self):
        web_app = FastAPI(
            title="Chatterbox TTS API",
            description="Text-to-speech with voice cloning",
            docs_url="/docs",
            dependencies=[Depends(verify_api_key)],
        )
        web_app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

        @web_app.post("/generate", responses={200: {"content": {"audio/wav": {}}}})
        def generate_speech(request: TTSRequest):
            try:
                audio_bytes = self.generate.local(
                    request.prompt,
                    request.voice_key,
                    request.temperature,
                    request.top_p,
                    request.top_k,
                    request.repetition_penalty,
                    request.norm_loudness,
                )
                return StreamingResponse(
                    io.BytesIO(audio_bytes),
                    media_type="audio/wav",
                )
            except HTTPException:
                raise
            except Exception as e:
                raise HTTPException(
                    status_code=500,
                    detail=f"Failed to generate audio: {e}",
                )

        return web_app

    @modal.method()
    def generate(
        self,
        prompt: str,
        voice_key: str,
        temperature: float = 0.8,
        top_p: float = 0.95,
        top_k: int = 1000,
        repetition_penalty: float = 1.2,
        norm_loudness: bool = True,
    ):
        voice_path = download_voice(voice_key)
        wav = self.model.generate(
            prompt,
            audio_prompt_path=voice_path,
            temperature=temperature,
            top_p=top_p,
            top_k=top_k,
            repetition_penalty=repetition_penalty,
            norm_loudness=norm_loudness,
        )

        buffer = io.BytesIO()
        ta.save(buffer, wav, self.model.sr, format="wav")
        buffer.seek(0)
        return buffer.read()


@app.local_entrypoint()
def test(
    prompt: str = "Chatterbox running on Modal [chuckle].",
    voice_key: str = "",
    output_path: str = "/tmp/chatterbox-tts/output.wav",
    temperature: float = 0.8,
    top_p: float = 0.95,
    top_k: int = 1000,
    repetition_penalty: float = 1.2,
    norm_loudness: bool = True,
):
    import pathlib

    if not voice_key:
        raise SystemExit("--voice-key is required (UploadThing file key)")

    chatterbox = Chatterbox()
    audio_bytes = chatterbox.generate.remote(
        prompt=prompt,
        voice_key=voice_key,
        temperature=temperature,
        top_p=top_p,
        top_k=top_k,
        repetition_penalty=repetition_penalty,
        norm_loudness=norm_loudness,
    )

    output_file = pathlib.Path(output_path)
    output_file.parent.mkdir(parents=True, exist_ok=True)
    output_file.write_bytes(audio_bytes)
    print(f"Audio saved to {output_file}")
