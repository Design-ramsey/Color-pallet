// ChromaCraft - Professional Color Palette Generator
// Main JavaScript functionality

class ColorPaletteGenerator {
    constructor() {
        this.currentColor = { h: 0, s: 100, l: 71 };
        this.currentHarmony = 'complementary';
        this.palette = [];
        this.savedPalettes = JSON.parse(localStorage.getItem('chromacraft-palettes') || '[]');
        this.particleSystem = null;
        
        this.init();
    }
    
    init() {
        this.setupParticleBackground();
        this.setupColorWheel();
        this.setupEventListeners();
        this.generatePalette();
        this.loadSavedPalettes();
        this.updateColorInfo();
        this.updateAccessibility();
    }
    
    // Particle background system
    setupParticleBackground() {
        const sketch = (p) => {
            let particles = [];
            
            p.setup = () => {
                const canvas = p.createCanvas(p.windowWidth, p.windowHeight);
                canvas.parent('particle-bg');
                
                // Create floating color particles
                for (let i = 0; i < 50; i++) {
                    particles.push({
                        x: p.random(p.width),
                        y: p.random(p.height),
                        size: p.random(2, 6),
                        speedX: p.random(-0.5, 0.5),
                        speedY: p.random(-0.5, 0.5),
                        color: p.color(p.random(360), 30, 80, 50)
                    });
                }
            };
            
            p.draw = () => {
                p.clear();
                
                particles.forEach(particle => {
                    p.fill(particle.color);
                    p.noStroke();
                    p.ellipse(particle.x, particle.y, particle.size);
                    
                    particle.x += particle.speedX;
                    particle.y += particle.speedY;
                    
                    // Wrap around screen
                    if (particle.x < 0) particle.x = p.width;
                    if (particle.x > p.width) particle.x = 0;
                    if (particle.y < 0) particle.y = p.height;
                    if (particle.y > p.height) particle.y = 0;
                });
            };
            
            p.windowResized = () => {
                p.resizeCanvas(p.windowWidth, p.windowHeight);
            };
        };
        
        new p5(sketch);
    }
    
    // Interactive color wheel setup
    setupColorWheel() {
        const wheelSketch = (p) => {
            let wheelRadius = 150;
            let centerX, centerY;
            
            p.setup = () => {
                const canvas = p.createCanvas(300, 300);
                canvas.parent('color-wheel');
                centerX = p.width / 2;
                centerY = p.height / 2;
                this.drawColorWheel(p);
            };
            
            p.draw = () => {
                this.drawColorWheel(p);
                this.drawColorPicker(p);
            };
            
            p.mousePressed = () => {
                if (p.mouseX >= 0 && p.mouseX <= p.width && p.mouseY >= 0 && p.mouseY <= p.height) {
                    const distance = p.dist(centerX, centerY, p.mouseX, p.mouseY);
                    if (distance <= wheelRadius) {
                        this.handleColorWheelClick(p.mouseX, p.mouseY, p);
                    }
                }
            };
            
            p.windowResized = () => {
                // Handle resize if needed
            };
        };
        
        new p5(wheelSketch);
    }
    
    drawColorWheel(p) {
        const centerX = p.width / 2;
        const centerY = p.height / 2;
        const wheelRadius = 150;
        
        p.colorMode(p.HSB, 360, 100, 100);
        
        for (let angle = 0; angle < 360; angle += 1) {
            for (let radius = 20; radius < wheelRadius; radius += 2) {
                const x = centerX + p.cos(p.radians(angle)) * radius;
                const y = centerY + p.sin(p.radians(angle)) * radius;
                
                const saturation = p.map(radius, 20, wheelRadius, 100, 0);
                p.fill(angle, saturation, 100);
                p.noStroke();
                p.ellipse(x, y, 3);
            }
        }
        
        // Draw center circle
        p.fill(0, 0, 0);
        p.ellipse(centerX, centerY, 40);
        p.fill(0, 0, 100);
        p.ellipse(centerX, centerY, 35);
    }
    
    drawColorPicker(p) {
        const centerX = p.width / 2;
        const centerY = p.height / 2;
        const wheelRadius = 150;
        
        // Calculate picker position based on current color
        const angle = this.currentColor.h;
        const saturation = this.currentColor.s;
        const radius = p.map(saturation, 0, 100, 20, wheelRadius);
        
        const pickerX = centerX + p.cos(p.radians(angle)) * radius;
        const pickerY = centerY + p.sin(p.radians(angle)) * radius;
        
        p.colorMode(p.RGB);
        p.stroke(255);
        p.strokeWeight(2);
        p.fill(this.hslToRgb(this.currentColor.h, this.currentColor.s, this.currentColor.l));
        p.ellipse(pickerX, pickerY, 16);
    }
    
    handleColorWheelClick(mouseX, mouseY, p) {
        const centerX = p.width / 2;
        const centerY = p.height / 2;
        
        const dx = mouseX - centerX;
        const dy = mouseY - centerY;
        
        let angle = (p.degrees(p.atan2(dy, dx)) + 360) % 360;
        let distance = p.dist(centerX, centerY, mouseX, mouseY);
        const wheelRadius = 150;
        
        let saturation = p.map(distance, 20, wheelRadius, 100, 0);
        saturation = p.constrain(saturation, 0, 100);
        
        this.currentColor.h = angle;
        this.currentColor.s = saturation;
        
        this.updateSliders();
        this.generatePalette();
        this.updateColorInfo();
        this.updateAccessibility();
    }
    
    setupEventListeners() {
        // Harmony rule tabs
        document.querySelectorAll('.harmony-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                document.querySelectorAll('.harmony-tab').forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                this.currentHarmony = e.target.dataset.rule;
                this.generatePalette();
            });
        });
        
        // Color sliders
        document.getElementById('hue-slider').addEventListener('input', (e) => {
            this.currentColor.h = parseInt(e.target.value);
            this.generatePalette();
            this.updateColorInfo();
            this.updateAccessibility();
        });
        
        document.getElementById('saturation-slider').addEventListener('input', (e) => {
            this.currentColor.s = parseInt(e.target.value);
            this.generatePalette();
            this.updateColorInfo();
            this.updateAccessibility();
        });
        
        document.getElementById('lightness-slider').addEventListener('input', (e) => {
            this.currentColor.l = parseInt(e.target.value);
            this.generatePalette();
            this.updateColorInfo();
            this.updateAccessibility();
        });
        
        document.getElementById('temperature-slider').addEventListener('input', (e) => {
            this.adjustTemperature(parseInt(e.target.value));
        });
        
        // Save and export buttons
        document.getElementById('save-palette').addEventListener('click', () => {
            this.saveCurrentPalette();
        });
        
        document.getElementById('export-palette').addEventListener('click', () => {
            this.exportPalette();
        });
        
        // Image upload
        document.getElementById('upload-trigger').addEventListener('click', () => {
            document.getElementById('image-upload').click();
        });
        
        document.getElementById('image-upload').addEventListener('change', (e) => {
            this.handleImageUpload(e.target.files[0]);
        });
        
        // Drag and drop
        const dropZone = document.querySelector('.border-dashed');
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('border-blue-400');
        });
        
        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('border-blue-400');
        });
        
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('border-blue-400');
            if (e.dataTransfer.files[0]) {
                this.handleImageUpload(e.dataTransfer.files[0]);
            }
        });
    }
    
    // Color harmony generation algorithms
    generatePalette() {
        const baseColor = this.currentColor;
        let palette = [];
        
        switch (this.currentHarmony) {
            case 'complementary':
                palette = [
                    baseColor,
                    { h: (baseColor.h + 180) % 360, s: baseColor.s, l: baseColor.l }
                ];
                break;
                
            case 'analogous':
                palette = [
                    { h: (baseColor.h - 30 + 360) % 360, s: baseColor.s, l: baseColor.l },
                    baseColor,
                    { h: (baseColor.h + 30) % 360, s: baseColor.s, l: baseColor.l }
                ];
                break;
                
            case 'triadic':
                palette = [
                    baseColor,
                    { h: (baseColor.h + 120) % 360, s: baseColor.s, l: baseColor.l },
                    { h: (baseColor.h + 240) % 360, s: baseColor.s, l: baseColor.l }
                ];
                break;
                
            case 'split-complementary':
                palette = [
                    baseColor,
                    { h: (baseColor.h + 150) % 360, s: baseColor.s, l: baseColor.l },
                    { h: (baseColor.h + 210) % 360, s: baseColor.s, l: baseColor.l }
                ];
                break;
                
            case 'tetradic':
                palette = [
                    baseColor,
                    { h: (baseColor.h + 90) % 360, s: baseColor.s, l: baseColor.l },
                    { h: (baseColor.h + 180) % 360, s: baseColor.s, l: baseColor.l },
                    { h: (baseColor.h + 270) % 360, s: baseColor.s, l: baseColor.l }
                ];
                break;
                
            case 'monochromatic':
                palette = [
                    { h: baseColor.h, s: baseColor.s, l: Math.max(20, baseColor.l - 30) },
                    { h: baseColor.h, s: baseColor.s, l: Math.max(30, baseColor.l - 15) },
                    baseColor,
                    { h: baseColor.h, s: baseColor.s, l: Math.min(90, baseColor.l + 15) },
                    { h: baseColor.h, s: baseColor.s, l: Math.min(95, baseColor.l + 30) }
                ];
                break;
        }
        
        this.palette = palette;
        this.displayPalette();
    }
    
    displayPalette() {
        const container = document.getElementById('palette-display');
        container.innerHTML = '';
        
        this.palette.forEach((color, index) => {
            const hexColor = this.hslToHex(color.h, color.s, color.l);
            const rgbColor = this.hslToRgb(color.h, color.s, color.l);
            
            const colorDiv = document.createElement('div');
            colorDiv.className = 'color-swatch flex items-center justify-between p-3 rounded-lg border border-gray-200';
            colorDiv.style.backgroundColor = hexColor;
            
            // Determine text color based on brightness
            const brightness = (rgbColor.r * 299 + rgbColor.g * 587 + rgbColor.b * 114) / 1000;
            const textColor = brightness > 128 ? '#000000' : '#ffffff';
            
            colorDiv.innerHTML = `
                <div class="flex items-center">
                    <div class="w-8 h-8 rounded-full border-2 border-white shadow-sm mr-3" style="background-color: ${hexColor}"></div>
                    <div style="color: ${textColor}">
                        <div class="font-mono text-sm">${hexColor}</div>
                        <div class="text-xs opacity-75">${Math.round(color.h)}° ${Math.round(color.s)}% ${Math.round(color.l)}%</div>
                    </div>
                </div>
                <button class="copy-btn px-2 py-1 text-xs rounded" style="background: rgba(255,255,255,0.2); color: ${textColor}" data-color="${hexColor}">Copy</button>
            `;
            
            // Add copy functionality
            colorDiv.querySelector('.copy-btn').addEventListener('click', (e) => {
                this.copyToClipboard(e.target.dataset.color);
                this.showTooltip(e.target, 'Copied!');
            });
            
            container.appendChild(colorDiv);
        });
        
        // Animate palette appearance
        anime({
            targets: '.color-swatch',
            opacity: [0, 1],
            translateY: [20, 0],
            delay: anime.stagger(100),
            duration: 500,
            easing: 'easeOutQuart'
        });
    }
    
    // Color conversion utilities
    hslToRgb(h, s, l) {
        h = h / 360;
        s = s / 100;
        l = l / 100;
        
        let r, g, b;
        
        if (s === 0) {
            r = g = b = l;
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };
            
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }
        
        return {
            r: Math.round(r * 255),
            g: Math.round(g * 255),
            b: Math.round(b * 255)
        };
    }
    
    hslToHex(h, s, l) {
        const rgb = this.hslToRgb(h, s, l);
        return this.rgbToHex(rgb.r, rgb.g, rgb.b);
    }
    
    rgbToHex(r, g, b) {
        return '#' + [r, g, b].map(x => {
            const hex = x.toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        }).join('');
    }
    
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }
    
    // Update UI elements
    updateSliders() {
        document.getElementById('hue-slider').value = this.currentColor.h;
        document.getElementById('saturation-slider').value = this.currentColor.s;
        document.getElementById('lightness-slider').value = this.currentColor.l;
    }
    
    updateColorInfo() {
        const hex = this.hslToHex(this.currentColor.h, this.currentColor.s, this.currentColor.l);
        const rgb = this.hslToRgb(this.currentColor.h, this.currentColor.s, this.currentColor.l);
        
        document.getElementById('hex-value').textContent = hex;
        document.getElementById('rgb-value').textContent = `${rgb.r}, ${rgb.g}, ${rgb.b}`;
        document.getElementById('hsl-value').textContent = `${Math.round(this.currentColor.h)}°, ${Math.round(this.currentColor.s)}%, ${Math.round(this.currentColor.l)}%`;
    }
    
    updateAccessibility() {
        const rgb = this.hslToRgb(this.currentColor.h, this.currentColor.s, this.currentColor.l);
        const contrast = this.calculateContrastRatio(rgb, { r: 255, g: 255, b: 255 });
        
        document.getElementById('contrast-ratio').textContent = `${contrast.toFixed(2)}:1`;
        
        const aaPass = contrast >= 4.5;
        const aaaPass = contrast >= 7.0;
        
        document.getElementById('wcag-aa').className = `accessibility-indicator ${aaPass ? 'accessibility-pass' : 'accessibility-fail'}`;
        document.getElementById('wcag-aaa').className = `accessibility-indicator ${aaaPass ? 'accessibility-pass' : 'accessibility-fail'}`;
    }
    
    calculateContrastRatio(rgb1, rgb2) {
        const luminance1 = this.calculateLuminance(rgb1);
        const luminance2 = this.calculateLuminance(rgb2);
        
        const lighter = Math.max(luminance1, luminance2);
        const darker = Math.min(luminance1, luminance2);
        
        return (lighter + 0.05) / (darker + 0.05);
    }
    
    calculateLuminance(rgb) {
        const { r, g, b } = rgb;
        const rs = r / 255;
        const gs = g / 255;
        const bs = b / 255;
        
        const adjust = (c) => {
            return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        };
        
        return 0.2126 * adjust(rs) + 0.7152 * adjust(gs) + 0.0722 * adjust(bs);
    }
    
    adjustTemperature(value) {
        // Temperature adjustment logic
        const adjustment = value / 50; // -1 to 1 range
        
        if (adjustment > 0) {
            // Warmer (shift towards red/orange)
            this.currentColor.h = (this.currentColor.h - adjustment * 30 + 360) % 360;
        } else if (adjustment < 0) {
            // Cooler (shift towards blue)
            this.currentColor.h = (this.currentColor.h - adjustment * 30) % 360;
        }
        
        this.updateSliders();
        this.generatePalette();
        this.updateColorInfo();
        this.updateAccessibility();
    }
    
    // Image color extraction
    handleImageUpload(file) {
        if (!file || !file.type.startsWith('image/')) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                this.extractColorsFromImage(img);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
    
    extractColorsFromImage(img) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Resize canvas for performance
        const maxSize = 200;
        const scale = Math.min(maxSize / img.width, maxSize / img.height);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Extract dominant colors
        const colorMap = new Map();
        for (let i = 0; i < data.length; i += 16) { // Sample every 4th pixel
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            // Quantize colors
            const quantizedR = Math.round(r / 16) * 16;
            const quantizedG = Math.round(g / 16) * 16;
            const quantizedB = Math.round(b / 16) * 16;
            
            const key = `${quantizedR},${quantizedG},${quantizedB}`;
            colorMap.set(key, (colorMap.get(key) || 0) + 1);
        }
        
        // Get top 5 colors
        const sortedColors = Array.from(colorMap.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);
        
        this.displayExtractedColors(sortedColors);
    }
    
    displayExtractedColors(colors) {
        const container = document.getElementById('extracted-colors');
        container.innerHTML = '';
        container.style.display = 'grid';
        
        colors.forEach(([rgb, count]) => {
            const [r, g, b] = rgb.split(',').map(Number);
            const hex = this.rgbToHex(r, g, b);
            
            const colorDiv = document.createElement('div');
            colorDiv.className = 'w-full h-20 rounded-lg cursor-pointer hover:scale-105 transition-transform';
            colorDiv.style.backgroundColor = hex;
            colorDiv.addEventListener('click', () => {
                this.copyToClipboard(hex);
                this.showTooltip(colorDiv, 'Copied!');
            });
            
            container.appendChild(colorDiv);
        });
    }
    
    // Palette management
    saveCurrentPalette() {
        const paletteName = prompt('Enter a name for this palette:') || `Palette ${this.savedPalettes.length + 1}`;
        
        const palette = {
            id: Date.now(),
            name: paletteName,
            colors: this.palette.map(color => ({
                h: color.h,
                s: color.s,
                l: color.l,
                hex: this.hslToHex(color.h, color.s, color.l)
            })),
            harmony: this.currentHarmony,
            created: new Date().toISOString()
        };
        
        this.savedPalettes.push(palette);
        localStorage.setItem('chromacraft-palettes', JSON.stringify(this.savedPalettes));
        
        this.displaySavedPalette(palette);
        this.showTooltip(document.getElementById('save-palette'), 'Palette saved!');
    }
    
    loadSavedPalettes() {
        const container = document.getElementById('saved-palettes');
        container.innerHTML = '';
        
        this.savedPalettes.slice(-6).forEach(palette => {
            this.displaySavedPalette(palette);
        });
    }
    
    displaySavedPalette(palette) {
        const container = document.getElementById('saved-palettes');
        
        const paletteCard = document.createElement('div');
        paletteCard.className = 'palette-card bg-white rounded-lg shadow-md p-4';
        
        paletteCard.innerHTML = `
            <h4 class="font-semibold mb-3">${palette.name}</h4>
            <div class="flex space-x-1 mb-3">
                ${palette.colors.map(color => `
                    <div class="flex-1 h-12 rounded" style="background-color: ${color.hex}"></div>
                `).join('')}
            </div>
            <div class="flex justify-between items-center">
                <span class="text-xs text-gray-500">${palette.harmony}</span>
                <div class="space-x-2">
                    <button class="load-palette text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700" data-id="${palette.id}">Load</button>
                    <button class="delete-palette text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700" data-id="${palette.id}">Delete</button>
                </div>
            </div>
        `;
        
        // Add event listeners
        paletteCard.querySelector('.load-palette').addEventListener('click', () => {
            this.loadPalette(palette);
        });
        
        paletteCard.querySelector('.delete-palette').addEventListener('click', () => {
            this.deletePalette(palette.id);
            paletteCard.remove();
        });
        
        container.appendChild(paletteCard);
    }
    
    loadPalette(palette) {
        if (palette.colors.length > 0) {
            const firstColor = palette.colors[0];
            this.currentColor = { h: firstColor.h, s: firstColor.s, l: firstColor.l };
            this.currentHarmony = palette.harmony;
            
            // Update UI
            document.querySelectorAll('.harmony-tab').forEach(tab => {
                tab.classList.remove('active');
                if (tab.dataset.rule === palette.harmony) {
                    tab.classList.add('active');
                }
            });
            
            this.updateSliders();
            this.generatePalette();
            this.updateColorInfo();
            this.updateAccessibility();
        }
    }
    
    deletePalette(id) {
        this.savedPalettes = this.savedPalettes.filter(p => p.id !== id);
        localStorage.setItem('chromacraft-palettes', JSON.stringify(this.savedPalettes));
    }
    
    exportPalette() {
        const paletteData = {
            name: `ChromaCraft Palette ${Date.now()}`,
            colors: this.palette.map(color => ({
                hex: this.hslToHex(color.h, color.s, color.l),
                rgb: this.hslToRgb(color.h, color.s, color.l),
                hsl: { h: color.h, s: color.s, l: color.l }
            })),
            harmony: this.currentHarmony,
            exportDate: new Date().toISOString()
        };
        
        const dataStr = JSON.stringify(paletteData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `${paletteData.name}.json`;
        link.click();
        
        this.showTooltip(document.getElementById('export-palette'), 'Palette exported!');
    }
    
    // Utility functions
    copyToClipboard(text) {
        navigator.clipboard.writeText(text).catch(() => {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
        });
    }
    
    showTooltip(element, text) {
        const tooltip = document.getElementById('tooltip');
        const rect = element.getBoundingClientRect();
        
        tooltip.textContent = text;
        tooltip.style.left = rect.left + rect.width / 2 - tooltip.offsetWidth / 2 + 'px';
        tooltip.style.top = rect.top - tooltip.offsetHeight - 10 + 'px';
        tooltip.style.opacity = '1';
        
        setTimeout(() => {
            tooltip.style.opacity = '0';
        }, 2000);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = new ColorPaletteGenerator();
    
    // Add smooth scrolling for navigation
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Add scroll animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // Observe elements for scroll animations
    document.querySelectorAll('.bg-white').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
});