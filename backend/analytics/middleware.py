import time
from django.utils.deprecation import MiddlewareMixin


class RequestTimingMiddleware(MiddlewareMixin):
    def process_request(self, request):
        request._start_time = time.time()

    def process_response(self, request, response):
        if hasattr(request, "_start_time"):
            elapsed = int((time.time() - request._start_time) * 1000)
            response["X-Response-Time-Ms"] = str(elapsed)
        return response
