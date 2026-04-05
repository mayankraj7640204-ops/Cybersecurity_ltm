document.addEventListener("DOMContentLoaded", () => {
    // 0. Environment Variables Injection
    const teamName = import.meta.env.VITE_TEAM_NAME || "Runtime Terrorz";
    const operatorId = import.meta.env.VITE_OPERATOR_ID || "ADMIN_777";

    const titleElement = document.querySelector('h1');
    if (titleElement) titleElement.textContent = teamName;

    const operatorInput = document.querySelector('.input-group input[placeholder="Enter ID"]');
    if (operatorInput) operatorInput.placeholder = `ID: ${operatorId}`;
    // 1. Accessibility Check
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // 2. Setup Canvas
    const canvas = document.getElementById("burst-canvas");
    const ctx = canvas.getContext("2d");

    let width, height;
    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    }
    window.addEventListener("resize", resize);
    resize();

    // 3. 3D Matrix Rain Data
    const numStreams = prefersReducedMotion ? 30 : 200;
    const streams = [];

    for (let i = 0; i < numStreams; i++) {
        const length = Math.floor(Math.random() * 20 + 5);
        const chars = [];
        for (let j = 0; j < length; j++) {
            chars.push(Math.random() > 0.5 ? '0' : '1');
        }

        streams.push({
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight - window.innerHeight,
            z: Math.random() * 2000, // Z-depth (from 0 to 2000)
            speed: Math.random() * 6 + 4,
            length: length,
            chars: chars,
            updateInterval: Math.floor(Math.random() * 5 + 3),
            frame: 0
        });
    }

    // sort by Z depth back-to-front so closer objects render on top
    streams.sort((a, b) => b.z - a.z);

    // 4. GSAP ScrollTrigger Setup
    gsap.registerPlugin(ScrollTrigger);
    const animationState = { progress: 0, time: 0 };
    ScrollTrigger.create({
        trigger: "body",
        start: "top top",
        end: "bottom bottom",
        scrub: 1,
        onUpdate: (self) => { animationState.progress = self.progress; }
    });

    const cards = gsap.utils.toArray('.glass-card');
    cards.forEach(card => {
        gsap.to(card, {
            scrollTrigger: { trigger: card, start: "top 80%", toggleActions: "play none none reverse" },
            opacity: 1, y: 0, duration: 1, ease: "power3.out"
        });
    });

    // 5. Canvas Render Loop
    function render() {
        if (!prefersReducedMotion) {
            animationState.time += 0.01;
        }

        ctx.clearRect(0, 0, width, height);

        const centerX = width / 2;
        const centerY = height / 2;

        for (let i = 0; i < numStreams; i++) {
            const s = streams[i];
            
            // Calculate pseudo-3D scale and opacity
            const perspective = 800 / (800 + s.z);
            const scale = Math.max(0.1, perspective);
            const baseOpacity = Math.max(0.1, 1 - (s.z / 2000));
            
            // Speed accelerates as you scroll down
            let scrollSpeed = prefersReducedMotion ? 1 : 1 + (animationState.progress * 4);
            if (isTwoFingers) {
                scrollSpeed *= 2; // 2x speed when using two fingers
            }
            s.y += s.speed * scrollSpeed * scale; // slower in the distance

            // Reset if off bottom
            if (s.y - (s.length * 24 * scale) > height) {
                s.y = -50;
                s.x = Math.random() * width;
                // occasionally random new depth
                if (Math.random() > 0.8) {
                    s.z = Math.random() * 2000;
                    streams.sort((a, b) => b.z - a.z); // resort
                }
            }

            s.frame++;
            if (s.frame % s.updateInterval === 0 && !prefersReducedMotion) {
                s.chars.pop();
                s.chars.unshift(Math.random() > 0.5 ? '0' : '1');
            }

            const fontSize = 24 * scale;
            ctx.font = `600 ${fontSize}px "Space Grotesk"`;
            
            // X swaying motion for a "revolving" or floating feel
            const sway = Math.sin(animationState.time + s.z) * 30 * scale;
            const drawX = s.x + sway;

            for (let j = 0; j < s.length; j++) {
                const charY = s.y - (j * fontSize);
                
                // Culling for performance
                if (charY < -fontSize || charY > height + fontSize) continue;

                if (j === 0) {
                    // Head
                    ctx.fillStyle = `rgba(255, 255, 255, ${baseOpacity})`;
                    if (scale > 0.5) {
                        ctx.shadowColor = '#00E5FF';
                        ctx.shadowBlur = 15 * scale;
                    }
                } else {
                    // Tail fading
                    ctx.shadowBlur = 0;
                    const tailAlpha = baseOpacity * (1 - (j / s.length));
                    const color = j % 3 === 0 ? '0, 229, 255' : '10, 88, 202';
                    ctx.fillStyle = `rgba(${color}, ${tailAlpha})`;
                }
                
                ctx.fillText(s.chars[j], drawX, charY);
            }
        }
        
        ctx.shadowBlur = 0;

        // Overlay vignette
        const gradient = ctx.createRadialGradient(centerX, centerY, height / 4, centerX, centerY, height);
        gradient.addColorStop(0, 'rgba(0, 2, 10, 0)');
        gradient.addColorStop(1, 'rgba(0, 2, 10, 0.8)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        requestAnimationFrame(render);
    }

    // 6. Cyber Lock Interaction
    const lockContainer = document.getElementById('holdScanner');
    const scannerBtn = document.getElementById('scannerBtn');
    const scannerProgress = document.getElementById('scannerProgress');
    const loginModal = document.getElementById('loginModal');
    const closeModal = document.getElementById('closeModal');
    const modalBackdrop = document.getElementById('modalBackdrop');
    
    if (lockContainer && scannerBtn && scannerProgress) {
        let holdTimer;
        let drainTimer;
        let progress = 0;
        const maxProgress = 100;
        const circumference = 54 * 2 * Math.PI; // r=54
        
        const setProgress = (percent) => {
            const offset = circumference - (percent / 100) * circumference;
            scannerProgress.style.strokeDashoffset = offset;
        };
        
        // init
        setProgress(0);

        const startHold = (e) => {
            if (scannerBtn.classList.contains('unlocked')) return;
            // Prevent text selection on mobile
            if (e.cancelable) e.preventDefault();
            
            clearInterval(drainTimer);
            
            holdTimer = setInterval(() => {
                progress += 2; // Fill up over ~1sec
                
                if (progress >= maxProgress) {
                    progress = maxProgress;
                    clearInterval(holdTimer);
                    
                    // Unlocked!
                    scannerBtn.classList.add('unlocked');
                    document.getElementById('lockIconSVG').innerHTML = '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 0 10 0"></path>';
                    
                    setTimeout(() => {
                        loginModal.classList.add('active');
                    }, 500);
                }
                setProgress(progress);
            }, 20);
        };

        const stopHold = () => {
            if (progress >= maxProgress) return;
            clearInterval(holdTimer);
            clearInterval(drainTimer);
            
            // Drain progress quickly
            drainTimer = setInterval(() => {
                progress -= 4;
                if (progress <= 0) {
                    progress = 0;
                    clearInterval(drainTimer);
                }
                setProgress(progress);
            }, 20);
        };

        scannerBtn.addEventListener('mousedown', startHold);
        scannerBtn.addEventListener('touchstart', startHold, { passive: false });
        
        window.addEventListener('mouseup', stopHold);
        window.addEventListener('touchend', stopHold);
    }

    // Modal close logic
    if (closeModal && modalBackdrop) {
        let closeProgress = 0;
        const closeMaxProgress = 100;
        const closeCircumference = 20 * 2 * Math.PI; // r=20
        let holdCloseTimer;
        let drainCloseTimer;

        const setCloseProgress = (percent) => {
            const ring = document.getElementById('closeProgressRing');
            if (!ring) return;
            const offset = closeCircumference - (percent / 100) * closeCircumference;
            ring.style.strokeDashoffset = offset;
        };

        const closeOverlay = () => {
            loginModal.classList.remove('active');
            
            setTimeout(() => {
                closeProgress = 0;
                setCloseProgress(0);

                if (scannerBtn) {
                    scannerBtn.classList.remove('unlocked');
                    document.getElementById('lockIconSVG').innerHTML = '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path>';
                    // Reset progress visually
                    let p = 100;
                    const drain = setInterval(() => {
                        p -= 5;
                        if (p <= 0) {
                            p = 0;
                            clearInterval(drain);
                        }
                        const circumference = 54 * 2 * Math.PI;
                        scannerProgress.style.strokeDashoffset = circumference - (p / 100) * circumference;
                    }, 20);
                }
            }, 500);
        };

        const startHoldClose = (e) => {
            if (e.cancelable) e.preventDefault();
            clearInterval(drainCloseTimer);
            holdCloseTimer = setInterval(() => {
                closeProgress += 3;
                if (closeProgress >= closeMaxProgress) {
                    closeProgress = closeMaxProgress;
                    clearInterval(holdCloseTimer);
                    closeOverlay();
                }
                setCloseProgress(closeProgress);
            }, 20);
        };

        const stopHoldClose = () => {
            if (closeProgress >= closeMaxProgress) return;
            clearInterval(holdCloseTimer);
            clearInterval(drainCloseTimer);
            drainCloseTimer = setInterval(() => {
                closeProgress -= 6;
                if (closeProgress <= 0) {
                    closeProgress = 0;
                    clearInterval(drainCloseTimer);
                }
                setCloseProgress(closeProgress);
            }, 20);
        };

        closeModal.addEventListener('mousedown', startHoldClose);
        closeModal.addEventListener('touchstart', startHoldClose, { passive: false });
        closeModal.addEventListener('click', () => { closeProgress = closeMaxProgress; closeOverlay(); });
        modalBackdrop.addEventListener('click', closeOverlay);
        
        window.addEventListener('mouseup', stopHoldClose);
        window.addEventListener('touchend', stopHoldClose);
    }

    // 7. MediaPipe Hand Tracking for Touchless Auth
    const videoElement = document.querySelector('.input_video');
    const trackingCanvas = document.getElementById('hand-tracking-canvas');
    const cursor = document.getElementById('virtual-cursor');
    let isHoveringScanner = false;
    let isHoveringClose = false;
    let isFist = false;
    let isTwoFingers = false;
    let smoothedX = window.innerWidth / 2;
    let smoothedY = window.innerHeight / 2;

    let trackCtx;
    if (trackingCanvas) {
        trackCtx = trackingCanvas.getContext('2d');
        function resizeTrackCanvas() {
            trackingCanvas.width = window.innerWidth;
            trackingCanvas.height = window.innerHeight;
        }
        window.addEventListener("resize", resizeTrackCanvas);
        resizeTrackCanvas();
    }

    const calculateDistance = (lm1, lm2) => {
        return Math.sqrt(Math.pow(lm1.x - lm2.x, 2) + Math.pow(lm1.y - lm2.y, 2) + Math.pow(lm1.z - lm2.z, 2));
    };

    if (window.Hands && videoElement && cursor) {
        const hands = new window.Hands({
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
            }
        });
        
        hands.setOptions({
            maxNumHands: 1,
            modelComplexity: 1,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        });

        hands.onResults((results) => {
            if (trackCtx) {
                trackCtx.clearRect(0, 0, trackingCanvas.width, trackingCanvas.height);
            }

            if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
                const landmarks = results.multiHandLandmarks[0];

                if (trackCtx && window.drawConnectors && window.drawLandmarks && window.HAND_CONNECTIONS) {
                    trackCtx.save();
                    window.drawConnectors(trackCtx, landmarks, window.HAND_CONNECTIONS, {
                        color: isFist ? '#ff5722' : '#00E5FF', 
                        lineWidth: 3 
                    });
                    window.drawLandmarks(trackCtx, landmarks, {
                        color: '#000B1D', 
                        fillColor: isFist ? '#ffeb3b' : '#00E5FF', 
                        lineWidth: 2, 
                        radius: 4 
                    });
                    trackCtx.restore();
                }
                
                // Use Palm center
                const palmCenter = landmarks[9];
                
                // Map to screen coordinates (X inverted for mirror)
                const targetX = (1 - palmCenter.x) * window.innerWidth;
                const targetY = palmCenter.y * window.innerHeight;
                
                // Exponential Moving Average Lerp to remove flutter/jitter
                smoothedX += (targetX - smoothedX) * 0.15;
                smoothedY += (targetY - smoothedY) * 0.15;
                
                cursor.style.transform = `translate(${smoothedX}px, ${smoothedY}px)`;
                
                // Detect Fist: Check if tip distances to wrist are smaller than knuckle distances to wrist
                const dTip8 = calculateDistance(landmarks[8], landmarks[0]);
                const dMcp5 = calculateDistance(landmarks[5], landmarks[0]);
                const dTip12 = calculateDistance(landmarks[12], landmarks[0]);
                const dMcp9 = calculateDistance(landmarks[9], landmarks[0]);
                
                // Finger extension patterns
                const indexExtended = dTip8 > dMcp5 * 1.2;
                const middleExtended = dTip12 > dMcp9 * 1.2;
                const ringExtended = calculateDistance(landmarks[16], landmarks[0]) > calculateDistance(landmarks[13], landmarks[0]) * 1.2;
                const pinkyExtended = calculateDistance(landmarks[20], landmarks[0]) > calculateDistance(landmarks[17], landmarks[0]) * 1.2;
                isTwoFingers = indexExtended && middleExtended && !ringExtended && !pinkyExtended;

                if (dTip8 < dMcp5 * 1.3 && dTip12 < dMcp9 * 1.3) {
                    if (!isFist) {
                        isFist = true;
                        cursor.classList.add('fist');
                    }
                } else {
                    if (isFist) {
                        isFist = false;
                        cursor.classList.remove('fist');
                    }
                }
                
                // Execute actions based on gesture
                if (isFist) {
                    // Can unlock if hovering
                    if (scannerBtn) {
                        const rect = scannerBtn.getBoundingClientRect();
                        if (smoothedX >= rect.left && smoothedX <= rect.right && smoothedY >= rect.top && smoothedY <= rect.bottom) {
                            if (!isHoveringScanner) {
                                isHoveringScanner = true;
                                scannerBtn.dispatchEvent(new CustomEvent('mousedown'));
                            }
                        } else {
                            if (isHoveringScanner) {
                                isHoveringScanner = false;
                                window.dispatchEvent(new CustomEvent('mouseup'));
                            }
                        }
                    }

                    // Can close if hovering close button
                    if (closeModal && loginModal && loginModal.classList.contains('active')) {
                        const wrapper = closeModal.closest('.close-wrapper');
                        const rect = (wrapper || closeModal).getBoundingClientRect();
                        const padding = 20; // Expanded hit area
                        if (smoothedX >= rect.left - padding && smoothedX <= rect.right + padding && 
                            smoothedY >= rect.top - padding && smoothedY <= rect.bottom + padding) {
                            if (!isHoveringClose) {
                                isHoveringClose = true;
                                closeModal.dispatchEvent(new CustomEvent('mousedown'));
                            }
                        } else {
                            if (isHoveringClose) {
                                isHoveringClose = false;
                                window.dispatchEvent(new CustomEvent('mouseup'));
                            }
                        }
                    } else if (isHoveringClose) {
                        isHoveringClose = false;
                        window.dispatchEvent(new CustomEvent('mouseup'));
                    }
                } else {
                    // Open Palm
                    if (isHoveringScanner) {
                        isHoveringScanner = false;
                        window.dispatchEvent(new CustomEvent('mouseup'));
                    }
                    if (isHoveringClose) {
                        isHoveringClose = false;
                        window.dispatchEvent(new CustomEvent('mouseup'));
                    }
                    
                    // Intuitive Palm Scrolling: Top/Bottom zones speed up scroll
                    const yRatio = smoothedY / window.innerHeight;
                    const scrollAmnt = isTwoFingers ? 12 : 6;
                    if (yRatio < 0.2) {
                        window.scrollBy({ top: -scrollAmnt, behavior: 'auto' });
                    } else if (yRatio > 0.8) {
                        window.scrollBy({ top: scrollAmnt, behavior: 'auto' });
                    }
                }
            } else {
                if (isHoveringScanner) {
                    isHoveringScanner = false;
                    window.dispatchEvent(new CustomEvent('mouseup'));
                }
                cursor.style.transform = `translate(-100px, -100px)`;
                if (isFist) {
                    isFist = false;
                    cursor.classList.remove('fist');
                }
            }
        });

        if (window.Camera) {
            const camera = new window.Camera(videoElement, {
                onFrame: async () => {
                    await hands.send({image: videoElement});
                },
                width: 640,
                height: 480
            });
            camera.start().catch((err) => {
                console.warn("Camera permissions likely denied. Hand tracking disabled.", err);
            });
        }
    }

    render();
});
