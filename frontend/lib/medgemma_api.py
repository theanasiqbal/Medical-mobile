import modal

# Define the container environment
app = modal.App("medgemma-1.5-api")

# GPU optimized image with medical dependencies
med_image = (
    modal.Image.from_registry("nvidia/cuda:12.1.1-devel-ubuntu22.04", add_python="3.11")
    .pip_install(
        "transformers>=4.50.0",
        "torch",
        "accelerate",
        "pillow",
        "huggingface_hub",
        "fastapi[standard]" # <--- Added this requirement
    )
)

@app.cls(
    image=med_image,
    gpu="A10G", 
    secrets=[modal.Secret.from_name("huggingface-secret")],
    scaledown_window=120,
)
class MedGemma:
    @modal.enter()
    def setup_model(self):
        from transformers import pipeline
        import torch

        print("Loading MedGemma 1.5 4B Model...")
        self.pipe = pipeline(
            "image-text-to-text",
            model="google/medgemma-1.5-4b-it",
            torch_dtype=torch.bfloat16,
            device_map="auto",
        )
        print("Model Loaded.")

    @modal.fastapi_endpoint(method="POST") # Uses FastAPI under the hood
    def analyze(self, body: dict):
        import base64
        import io
        from PIL import Image

        try:
            prompt = body.get("prompt", "Summarize the findings in this medical image.")
            
            # Decode the base64 image
            image_bytes = base64.b64decode(body["image"])
            image = Image.open(io.BytesIO(image_bytes))

            # Prepare the multimodal message structure
            messages = [
                {
                    "role": "user",
                    "content": [
                        {"type": "image", "image": image},
                        {"type": "text", "text": prompt}
                    ]
                }
            ]

            # Generate response
            output = self.pipe(text=messages, max_new_tokens=1024)
            result = output[0]["generated_text"][-1]["content"]

            return {"success": True, "analysis": result}
        except Exception as e:
            return {"success": False, "error": str(e)}
