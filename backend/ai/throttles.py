from rest_framework.throttling import UserRateThrottle, AnonRateThrottle


class AIUserThrottle(UserRateThrottle):
    scope = "ai_user"


class AIAnonThrottle(AnonRateThrottle):
    scope = "ai_anon"
