from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate
import requests
from django.conf import settings
import time
from rest_framework.permissions import AllowAny, IsAuthenticated

# Variables globales para el token de Factus
token_info = {
    "access_token": None,
    "expires_at": 0
}


def get_factus_token():
    current_time = time.time()
    if token_info["access_token"] and current_time < token_info["expires_at"]:
        return token_info["access_token"]
    url = "https://api-sandbox.factus.com.co/oauth/token"
    payload = {
        "grant_type": settings.FACTUS_CREDENTIALS["grant_type"],
        "client_id": settings.FACTUS_CREDENTIALS["client_id"],
        "client_secret": settings.FACTUS_CREDENTIALS["client_secret"],
        "username": settings.FACTUS_CREDENTIALS["username"],
        "password": settings.FACTUS_CREDENTIALS["password"]
    }
    headers = {"Accept": "application/json"}
    try:
        response = requests.post(url, data=payload, headers=headers)
        response.raise_for_status()
        data = response.json()
        token_info["access_token"] = data["access_token"]
        token_info["expires_at"] = current_time + 3600
        return token_info["access_token"]
    except requests.exceptions.RequestException as e:
        raise Exception(f"Error al obtener el token: {str(e)}")


class LoginView(APIView):
    permission_classes = [AllowAny]  # Permitir acceso sin autenticación previa

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        # Depuración
        print(f"Recibido: username={username}, password={password}")
        user = authenticate(username=username, password=password)
        if user:
            token, created = Token.objects.get_or_create(user=user)
            return Response({'token': token.key}, status=status.HTTP_200_OK)
        return Response({'error': 'Credenciales inválidas'}, status=status.HTTP_401_UNAUTHORIZED)


class LogoutView(APIView):
    # Requiere que el usuario esté autenticado
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            request.auth.delete()  # Elimina el token asociado al usuario
            return Response({"message": "Sesión cerrada exitosamente"}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class AuthenticateFactusView(APIView):
    def get(self, request):
        try:
            token = get_factus_token()
            return Response({"access_token": token}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)


class CreateInvoiceView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            token = get_factus_token()
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        url = "https://api-sandbox.factus.com.co/v1/bills/validate"
        invoice_data = request.data
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {token}",
            "Accept": "application/json"
        }
        try:
            response = requests.post(url, json=invoice_data, headers=headers)
            response.raise_for_status()
            return Response(response.json(), status=status.HTTP_201_CREATED)
        except requests.exceptions.RequestException as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
