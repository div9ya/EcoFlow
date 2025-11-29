function scrollToSection(sectionId) {
    const element = document.getElementById(sectionId);
    if (element) {
        const navbar = document.getElementById('navbar');
        const navbarHeight = navbar.offsetHeight;
        const elementPosition = element.offsetTop - navbarHeight;
        
        window.scrollTo({
            top: elementPosition,
            behavior: 'smooth'
        });
        
        closeMobileMenu();
    }
}

window.addEventListener('scroll', () => {
    const navbar = document.getElementById('navbar');
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const mobileMenu = document.getElementById('mobileMenu');

mobileMenuBtn.addEventListener('click', () => {
    mobileMenuBtn.classList.toggle('active');
    mobileMenu.classList.toggle('active');
});

function closeMobileMenu() {
    mobileMenuBtn.classList.remove('active');
    mobileMenu.classList.remove('active');
}

const contactForm = document.getElementById('contactForm');
const nameInput = document.getElementById('name');
const emailInput = document.getElementById('email');
const messageInput = document.getElementById('message');

function validateName(name) {
    const trimmedName = name.trim();
    if (trimmedName.length === 0) {
        return { valid: false, message: 'Name is required' };
    }
    if (trimmedName.length > 100) {
        return { valid: false, message: 'Name must be less than 100 characters' };
    }
    return { valid: true };
}

function validateEmail(email) {
    const trimmedEmail = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (trimmedEmail.length === 0) {
        return { valid: false, message: 'Email is required' };
    }
    if (!emailRegex.test(trimmedEmail)) {
        return { valid: false, message: 'Invalid email address' };
    }
    if (trimmedEmail.length > 255) {
        return { valid: false, message: 'Email must be less than 255 characters' };
    }
    return { valid: true };
}

function validateMessage(message) {
    const trimmedMessage = message.trim();
    if (trimmedMessage.length === 0) {
        return { valid: false, message: 'Message is required' };
    }
    if (trimmedMessage.length < 10) {
        return { valid: false, message: 'Message must be at least 10 characters' };
    }
    if (trimmedMessage.length > 1000) {
        return { valid: false, message: 'Message must be less than 1000 characters' };
    }
    return { valid: true };
}

function showError(inputId, message) {
    const errorElement = document.getElementById(`${inputId}Error`);
    const inputElement = document.getElementById(inputId);
    
    errorElement.textContent = message;
    errorElement.classList.add('active');
    inputElement.style.borderColor = '#dc2626';
}

function clearError(inputId) {
    const errorElement = document.getElementById(`${inputId}Error`);
    const inputElement = document.getElementById(inputId);
    
    errorElement.textContent = '';
    errorElement.classList.remove('active');
    inputElement.style.borderColor = '';
}

nameInput.addEventListener('blur', () => {
    const validation = validateName(nameInput.value);
    if (!validation.valid) {
        showError('name', validation.message);
    } else {
        clearError('name');
    }
});

emailInput.addEventListener('blur', () => {
    const validation = validateEmail(emailInput.value);
    if (!validation.valid) {
        showError('email', validation.message);
    } else {
        clearError('email');
    }
});

messageInput.addEventListener('blur', () => {
    const validation = validateMessage(messageInput.value);
    if (!validation.valid) {
        showError('message', validation.message);
    } else {
        clearError('message');
    }
});

contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const nameValidation = validateName(nameInput.value);
    const emailValidation = validateEmail(emailInput.value);
    const messageValidation = validateMessage(messageInput.value);
    
    clearError('name');
    clearError('email');
    clearError('message');
    
    let hasErrors = false;
    
    if (!nameValidation.valid) {
        showError('name', nameValidation.message);
        hasErrors = true;
    }
    
    if (!emailValidation.valid) {
        showError('email', emailValidation.message);
        hasErrors = true;
    }
    
    if (!messageValidation.valid) {
        showError('message', messageValidation.message);
        hasErrors = true;
    }
    
    if (!hasErrors) {
        const submitBtn = contactForm.querySelector('button[type="submit"]');
        const submitText = document.getElementById('submitText');
        
        submitBtn.disabled = true;
        submitText.textContent = 'Sending...';
        
        setTimeout(() => {
            contactForm.reset();
            
            submitBtn.disabled = false;
            submitText.textContent = 'Send Message';
            
            showToast('Message sent successfully! We\'ll get back to you soon.');
        }, 1500);
    }
});

function showToast(message) {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    
    toastMessage.textContent = message;
    toast.classList.add('active');
    
    setTimeout(() => {
        toast.classList.remove('active');
    }, 5000);
}

document.getElementById('currentYear').textContent = new Date().getFullYear();

const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animate-fade-in');
        }
    });
}, observerOptions);

document.querySelectorAll('section').forEach(section => {
    observer.observe(section);
});
