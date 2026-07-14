from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from .serializers import AIRequestSerializer

class OutfitRecommendView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = AIRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response({'result': 'outfit_recommendation_placeholder'})

class StylingSuggestionsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = AIRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response({'result': 'styling_suggestions_placeholder'})

class TryOnView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = AIRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response({'result': 'try_on_placeholder'})

class SmartSearchView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        q = request.query_params.get('q', '')
        return Response({'results': [], 'query': q})

class EditView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = AIRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response({'result': 'edit_placeholder'})
