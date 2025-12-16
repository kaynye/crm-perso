import base64
import os
from django.conf import settings
from openai import OpenAI

try:
    import google.generativeai as genai
except ImportError:
    genai = None

class VisionTools:
    @staticmethod
    def analyze_image(file_path, prompt, user=None):
        """
        Analyzes an image using GPT-4o or Gemini Pro Vision.
        """
        if not os.path.exists(file_path):
            return "Error: File not found."

        conf = settings.AI_CONF
        provider = conf.get('PROVIDER', 'openai')
        api_key = conf.get('API_KEY', '').strip().strip("'").strip('"')

        if provider == 'gemini':
             return VisionTools._analyze_with_gemini(file_path, prompt, api_key)
        else:
             return VisionTools._analyze_with_openai(file_path, prompt, api_key, conf.get('BASE_URL'))

    @staticmethod
    def _analyze_with_openai(file_path, prompt, api_key, base_url):
        client = OpenAI(api_key=api_key, base_url=base_url)
        
        # Encode image
        with open(file_path, "rb") as image_file:
            base64_image = base64.b64encode(image_file.read()).decode('utf-8')

        try:
            response = client.chat.completions.create(
                model="gpt-4o", # Assume 4o or 4-vision
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{base64_image}"
                                },
                            },
                        ],
                    }
                ],
                max_tokens=500,
            )
            return response.choices[0].message.content
        except Exception as e:
            return f"Error analyzing image with OpenAI: {str(e)}"

    @staticmethod
    def _analyze_with_gemini(file_path, prompt, api_key):
        if not genai:
            return "Error: google-generativeai not installed."
            
        genai.configure(api_key=api_key)
        # Gemini Pro Vision or 1.5 Flash
        model = genai.GenerativeModel('gemini-1.5-flash') 
        
        try:
            # Uploading file to Gemini API or passing bytes?
            # GenAI python SDK supports PIL images or bytes
            import PIL.Image
            img = PIL.Image.open(file_path)
            
            response = model.generate_content([prompt, img])
            return response.text
        except Exception as e:
            return f"Error analyzing image with Gemini: {str(e)}"
