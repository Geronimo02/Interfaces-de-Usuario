// Manejo de eventos para el login
document.addEventListener('DOMContentLoaded', () => {
  
  // Manejar botones sociales sin onclick inline
  const facebookBtn = document.querySelector('.btn-facebook');
  const googleBtn = document.querySelector('.btn-google');
  
  if (facebookBtn) {
    facebookBtn.addEventListener('click', (e) => {
      e.preventDefault();
      alert('Facebook OAuth simulado');
      // Aquí iría la integración real con Facebook
    });
  }
  
  if (googleBtn) {
    googleBtn.addEventListener('click', (e) => {
      e.preventDefault();
      alert('Google OAuth simulado');
      // Aquí iría la integración real con Google
    });
  }

  // Manejar el formulario principal
  const loginForm = document.querySelector('form');
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      // Opcional: validaciones adicionales antes del submit
      const email = loginForm.querySelector('input[type="email"]').value;
      const password = loginForm.querySelector('input[type="password"]').value;
      
      if (!email || !password) {
        e.preventDefault();
        alert('Por favor completa todos los campos');
        return;
      }
      
      // Si todo está bien, el formulario se enviará normalmente
      console.log('Login attempt:', { email, password: '***' });
    });
  }

  // Manejar "¿Olvidaste la contraseña?"
  const forgotLink = document.querySelector('.forgot .link');
  if (forgotLink) {
    forgotLink.addEventListener('click', (e) => {
      e.preventDefault();
      alert('Funcionalidad de recuperación de contraseña en desarrollo');
    });
  }
});