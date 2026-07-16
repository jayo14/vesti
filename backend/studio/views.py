from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Project, Generation
from .serializers import ProjectSerializer, GenerationSerializer


class ProjectViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Project.objects.filter(user=self.request.user)


class AdminGenerationListView(APIView):
    """Recent completed generations for admin spot-check review.

    Optional query params:
    - ``limit`` (default 30) — how many recent generations to include.
    - ``page`` (default 1) — offset-based paging.
    - ``flagged`` — filter by flagged status (true/false).
    """
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        qs = Generation.objects.select_related("user", "product").all()
        flagged = request.query_params.get("flagged")
        if flagged == "true":
            qs = qs.filter(flagged=True)
        elif flagged == "false":
            qs = qs.filter(flagged=False)
        qs = qs.order_by("-created_at")

        limit = int(request.query_params.get("limit", "30"))
        page = int(request.query_params.get("page", "1"))
        offset = (page - 1) * limit
        qs = qs[offset : offset + limit]

        return Response(GenerationSerializer(qs, many=True).data)


class AdminGenerationFlagView(APIView):
    """Toggle the flagged status on a generation."""
    permission_classes = [permissions.IsAdminUser]

    def post(self, request, pk):
        try:
            gen = Generation.objects.get(pk=pk)
        except Generation.DoesNotExist:
            return Response({"detail": "Generation not found."},
                            status=status.HTTP_404_NOT_FOUND)
        gen.flagged = not gen.flagged
        gen.save(update_fields=["flagged"])
        return Response({
            "id": gen.id,
            "flagged": gen.flagged,
        })
