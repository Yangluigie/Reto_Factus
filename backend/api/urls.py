from django.urls import path
from invoices import views as views_invoices

urlpatterns = [
    path('login/', views_invoices.LoginView.as_view(), name='login'),
    path('logout/', views_invoices.LogoutView.as_view(), name='logout'),
    path('authenticate/', views_invoices.AuthenticateFactusView.as_view(),
         name='authenticate'),
    path('create-invoice/', views_invoices.CreateInvoiceView.as_view(),
         name='create_invoice'),
]
