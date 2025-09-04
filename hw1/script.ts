// Typing animation for bio
class TypeWriter {
    private element: HTMLElement;
    private texts: string[];
    private typeSpeed: number;
    private deleteSpeed: number;
    private pauseTime: number;
    private currentTextIndex: number;
    private currentCharIndex: number;
    private isDeleting: boolean;
    private isPaused: boolean;

    constructor(element: HTMLElement, texts: string[], typeSpeed: number = 100, deleteSpeed: number = 50, pauseTime: number = 2000) {
        this.element = element;
        this.texts = texts;
        this.typeSpeed = typeSpeed;
        this.deleteSpeed = deleteSpeed;
        this.pauseTime = pauseTime;
        this.currentTextIndex = 0;
        this.currentCharIndex = 0;
        this.isDeleting = false;
        this.isPaused = false;
    }

    type(): void {
        const currentText = this.texts[this.currentTextIndex];
        
        if (!this.isDeleting && this.currentCharIndex < currentText.length) {
            // Typing
            this.element.textContent = currentText.substring(0, this.currentCharIndex + 1);
            this.currentCharIndex++;
            setTimeout(() => this.type(), this.typeSpeed);
        } else if (this.isDeleting && this.currentCharIndex > 0) {
            // Deleting
            this.element.textContent = currentText.substring(0, this.currentCharIndex - 1);
            this.currentCharIndex--;
            setTimeout(() => this.type(), this.deleteSpeed);
        } else {
            // Switch between typing and deleting
            if (!this.isDeleting) {
                this.isDeleting = true;
                setTimeout(() => this.type(), this.pauseTime);
            } else {
                this.isDeleting = false;
                this.currentTextIndex = (this.currentTextIndex + 1) % this.texts.length;
                setTimeout(() => this.type(), this.typeSpeed);
            }
        }
    }

    start(): void {
        this.type();
    }
}

// Particle System
class ParticleSystem {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private particles: Particle[];
    private mouseX: number;
    private mouseY: number;
    private theme: string;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d')!;
        this.particles = [];
        this.mouseX = 0;
        this.mouseY = 0;
        this.theme = 'dark';
        this.resize();
        this.createParticles();
        this.animate();
        
        // Mouse tracking
        document.addEventListener('mousemove', (e) => {
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
        });
        
        // Resize handler
        window.addEventListener('resize', () => this.resize());
    }

    resize(): void {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    getThemeHue(): number {
        // Different hue ranges for different themes
        if (this.theme === 'light') {
            return Math.random() * 40 + 200; // Blue range for light theme
        } else {
            return Math.random() * 60 + 200; // Blue to purple range for dark theme
        }
    }
    
    getThemeOpacity(): number {
        return this.theme === 'light' ? 0.6 : 0.8;
    }

    createParticles(): void {
        const particleCount = Math.floor((this.canvas.width * this.canvas.height) / 15000);
        
        for (let i = 0; i < particleCount; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                size: Math.random() * 2 + 0.5,
                opacity: Math.random() * this.getThemeOpacity() + 0.2,
                hue: this.getThemeHue()
            });
        }
    }

    updateParticles(): void {
        this.particles.forEach(particle => {
            // Update position
            particle.x += particle.vx;
            particle.y += particle.vy;

            // Mouse interaction
            const dx = this.mouseX - particle.x;
            const dy = this.mouseY - particle.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 100) {
                const force = (100 - distance) / 100;
                particle.x += dx * force * 0.01;
                particle.y += dy * force * 0.01;
            }

            // Wrap around edges
            if (particle.x < 0) particle.x = this.canvas.width;
            if (particle.x > this.canvas.width) particle.x = 0;
            if (particle.y < 0) particle.y = this.canvas.height;
            if (particle.y > this.canvas.height) particle.y = 0;

            // Slight opacity fluctuation
            particle.opacity += (Math.random() - 0.5) * 0.02;
            particle.opacity = Math.max(0.1, Math.min(this.getThemeOpacity(), particle.opacity));
        });
    }

    drawParticles(): void {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw connections
        this.particles.forEach((particle, i) => {
            for (let j = i + 1; j < this.particles.length; j++) {
                const other = this.particles[j];
                const dx = particle.x - other.x;
                const dy = particle.y - other.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < 120) {
                    const opacity = (120 - distance) / 120 * (this.theme === 'light' ? 0.2 : 0.3);
                    const saturation = this.theme === 'light' ? '50%' : '70%';
                    const lightness = this.theme === 'light' ? '40%' : '60%';
                    this.ctx.strokeStyle = `hsla(${particle.hue}, ${saturation}, ${lightness}, ${opacity})`;
                    this.ctx.lineWidth = 0.5;
                    this.ctx.beginPath();
                    this.ctx.moveTo(particle.x, particle.y);
                    this.ctx.lineTo(other.x, other.y);
                    this.ctx.stroke();
                }
            }
        });

        // Draw particles
        this.particles.forEach(particle => {
            const saturation = this.theme === 'light' ? '50%' : '70%';
            const lightness = this.theme === 'light' ? '40%' : '60%';
            this.ctx.fillStyle = `hsla(${particle.hue}, ${saturation}, ${lightness}, ${particle.opacity})`;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();

            // Glow effect (stronger in dark mode)
            if (this.theme === 'dark') {
                this.ctx.shadowColor = `hsl(${particle.hue}, 70%, 60%)`;
                this.ctx.shadowBlur = particle.size * 2;
                this.ctx.fill();
                this.ctx.shadowBlur = 0;
            }
        });
    }

    animate(): void {
        this.updateParticles();
        this.drawParticles();
        requestAnimationFrame(() => this.animate());
    }
}

// Mouse follower
class MouseFollower {
    private follower: HTMLElement;
    private x: number;
    private y: number;
    private targetX: number;
    private targetY: number;

    constructor() {
        this.follower = document.createElement('div');
        this.follower.className = 'mouse-follower';
        document.body.appendChild(this.follower);
        
        this.x = 0;
        this.y = 0;
        this.targetX = 0;
        this.targetY = 0;
        
        document.addEventListener('mousemove', (e) => {
            this.targetX = e.clientX;
            this.targetY = e.clientY;
        });
        
        this.animate();
    }
    
    animate(): void {
        this.x += (this.targetX - this.x) * 0.1;
        this.y += (this.targetY - this.y) * 0.1;
        
        this.follower.style.left = this.x - 10 + 'px';
        this.follower.style.top = this.y - 10 + 'px';
        
        requestAnimationFrame(() => this.animate());
    }
}

// Scroll animations
class ScrollAnimations {
    private elements: NodeListOf<Element>;
    private observer: IntersectionObserver;

    constructor() {
        this.elements = document.querySelectorAll('section, .link-card');
        this.observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('fade-in');
                    }
                });
            },
            { threshold: 0.1 }
        );
        
        this.elements.forEach(el => this.observer.observe(el));
    }
}

// Particle interface
interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    opacity: number;
    hue: number;
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Create particle canvas
    const canvas = document.createElement('canvas');
    canvas.id = 'particles-canvas';
    document.body.prepend(canvas);
    
    // Initialize systems
    const typedTextElement = document.getElementById('typed-text')!;
    const bioTexts = [
        'Physician & Computer Science Student',
        'Exploring the intersection of medicine and technology',
        'Passionate about Information Retrieval and Medical AI'
    ];
    
    const typewriter = new TypeWriter(typedTextElement, bioTexts, 80, 40, 2500);
    const particleSystem = new ParticleSystem(canvas);
    const mouseFollower = new MouseFollower();
    const scrollAnimations = new ScrollAnimations();
    
    // Start typing animation
    typewriter.start();
    
    // Add interactive hover effects to skill items
    document.querySelectorAll('.skill-item').forEach(item => {
        item.addEventListener('mouseenter', function(this: HTMLElement) {
            this.style.transform = 'translateY(-3px) scale(1.05)';
        });
        
        item.addEventListener('mouseleave', function(this: HTMLElement) {
            this.style.transform = 'translateY(-2px)';
        });
    });
    
    // Add click effects to link cards
    document.querySelectorAll('.link-card').forEach(card => {
        card.addEventListener('click', function(this: HTMLElement, e: Event) {
            const mouseEvent = e as MouseEvent;
            // Create enhanced ripple effect for circular buttons
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height) * 1.2;
            const x = mouseEvent.clientX - rect.left - size / 2;
            const y = mouseEvent.clientY - rect.top - size / 2;
            
            ripple.style.cssText = `
                position: absolute;
                left: ${x}px;
                top: ${y}px;
                width: ${size}px;
                height: ${size}px;
                background: rgba(255, 255, 255, 0.4);
                border-radius: 50%;
                transform: scale(0);
                animation: ripple 0.6s ease-out;
                pointer-events: none;
                z-index: 1;
            `;
            
            this.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
        
        // Add smooth hover transition delay
        card.addEventListener('mouseenter', function(this: HTMLElement) {
            this.style.transitionDelay = '0.1s';
        });
        
        card.addEventListener('mouseleave', function(this: HTMLElement) {
            this.style.transitionDelay = '0s';
        });
    });
    
    // Add CSS for ripple animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes ripple {
            to {
                transform: scale(4);
                opacity: 0;
            }
        }
        
        .link-card {
            position: relative;
            overflow: hidden;
        }
    `;
    document.head.appendChild(style);
});

// Add some extra interactive features
document.addEventListener('DOMContentLoaded', () => {
    // Smooth scroll behavior
    document.documentElement.style.scrollBehavior = 'smooth';
});
