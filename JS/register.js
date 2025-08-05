document.getElementById('registerForm').addEventListener('submit', function (e) {
    e.preventDefault();
  
    // Clear previous errors
    document.querySelectorAll('.error').forEach(span => span.textContent = '');
  
    const fullname = document.getElementById('fullname').value.trim();
    const email = document.getElementById('email').value.trim();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
  
    let hasError = false;
  
    if (fullname.length < 3) {
      document.getElementById('fullnameError').textContent = 'Full name must be at least 3 characters.';
      hasError = true;
    }
  
    if (!email.includes('@')) {
      document.getElementById('emailError').textContent = 'Enter a valid email address.';
      hasError = true;
    }
  
    if (username.length < 4) {
      document.getElementById('usernameError').textContent = 'Username must be at least 4 characters.';
      hasError = true;
    }
  
    if (password.length < 6) {
      document.getElementById('passwordError').textContent = 'Password must be at least 6 characters.';
      hasError = true;
    }
  
    if (password !== confirmPassword) {
      document.getElementById('confirmPasswordError').textContent = 'Passwords do not match.';
      hasError = true;
    }
  
    if (!hasError) {
      const user = {
        fullname: fullname,
        email: email,
        username: username,
        password: password
    };
    localStorage.setItem('user_' + username, JSON.stringify(user));

    alert('Registration successful!');
    document.getElementById('registerForm').reset();
  }
  });
  
  function registervalidation(){
    var fullname=document.getElementById('fullname').value
    var email=document.getElementById('email').value
    var phonenumber=document.getElementById('phonenumber').value
    var password=document.getElementById('password').value
    var confirm=document.getElementById('confirm').value

    var fullnameError=document.getElementById('fullnameError');
    var emailError=document.getElementById('emailError');
    var phonenumberError=document.getElementById('phonenumberError');
    var passwordError=document.getElementById('passwordError');
    var confirmError=document.getElementById('confirmError');

    fullnameError.innerHTML="";
    emailError.innerHTML="";
    phonenumberError.innerHTML="";
    passwordError.innerHTML="";
    confirmError.innerHTML="";
    success.innerHTML="";

    //check for empty fields and display error messages
    if(fullname==""){
        fullnameError.innerHTML="Please enter your name";
        return false;
    }
    if(email==""){
        emailError.innerHTML="please enter your email";
        return false;
    }
    if(phonenumber==""){
        phonenumberError.innerHTML="please enter your phone number";
        return false;
    }
    if(password==""){
        passwordError.innerHTML="please enter your password";
        return false;
    }
    if(confirm==""){
        confirmError.innerHTML="please confirm your password";
        return false;
    }
    success.innerHTML="Form has been submitted";
    return true;
  }