import uuid
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from django.conf import settings
from django.core.files.storage import default_storage
from django.core.exceptions import ValidationError

ALLOWED_MIME_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/avif",
}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


class UploadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        file = request.FILES.get("file")
        if not file:
            return Response({"error": "No file provided"}, status=status.HTTP_400_BAD_REQUEST)

        if file.size > MAX_FILE_SIZE:
            return Response(
                {"error": "File too large. Maximum size is 10 MB."},
                status=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            )

        content_type = getattr(file, "content_type", "")
        if content_type and content_type not in ALLOWED_MIME_TYPES:
            return Response(
                {"error": f"File type '{content_type}' is not supported. Use JPEG, PNG, WebP, or AVIF."},
                status=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            )

        ext = file.name.rsplit(".", 1)[-1].lower() if "." in file.name else "jpg"
        if ext not in {"jpg", "jpeg", "png", "webp", "avif"}:
            ext = "jpg"

        filename = f"uploads/{uuid.uuid4().hex}.{ext}"

        saved_name = default_storage.save(filename, file)
        url = default_storage.url(saved_name)

        return Response({"url": url, "filename": saved_name})
