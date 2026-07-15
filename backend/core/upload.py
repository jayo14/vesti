import uuid
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from django.conf import settings

class UploadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        file = request.FILES.get("file")
        if not file:
            return Response({"error": "No file provided"}, status=status.HTTP_400_BAD_REQUEST)

        ext = file.name.split(".")[-1] if "." in file.name else "jpg"
        filename = f"{uuid.uuid4().hex}.{ext}"
        path = settings.MEDIA_ROOT / filename
        path.parent.mkdir(exist_ok=True)

        with open(path, "wb") as f:
            for chunk in file.chunks():
                f.write(chunk)

        url = f"{settings.MEDIA_URL}{filename}"
        return Response({"url": url, "filename": filename})
