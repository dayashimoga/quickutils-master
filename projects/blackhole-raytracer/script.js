'use strict';
(function() {
    const $ = s => document.querySelector(s);
    if(typeof QU !== 'undefined') QU.init({ kofi: true, theme: true });

    const canvas = document.getElementById('glCanvas');
    const gl = canvas.getContext('webgl');
    if (!gl) {
        alert('WebGL not supported');
        return;
    }

    // Vertex shader
    const vsSource = `
        attribute vec4 aVertexPosition;
        void main() {
            gl_Position = aVertexPosition;
        }
    `;

    // Fragment shader (Raytracer with approximated Schwarzschild metric bending)
    // To do this fast, we step the ray. Accretion disk is a flat disc.
    const fsSource = `
        precision highp float;
        
        uniform vec2 u_resolution;
        uniform float u_time;
        uniform vec3 u_cameraPos;
        uniform mat3 u_cameraMat;
        uniform float u_mass;
        uniform float u_diskSize;
        uniform float u_fov;

        // Random noise for stars/gas
        float hash(vec3 p) {
            p = fract(p * 0.3183099 + 0.1);
            p *= 17.0;
            return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
        }
        
        float noise(vec3 x) {
            vec3 i = floor(x);
            vec3 f = fract(x);
            f = f * f * (3.0 - 2.0 * f);
            return mix(mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),
                           mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
                       mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
                           mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
        }

        // Accretion disk volumetric rendering
        vec4 diskDens(vec3 p) {
            float r = length(p.xz);
            if(r < 1.0 || r > u_diskSize) return vec4(0.0);
            
            // Thickness
            float h = abs(p.y);
            float maxH = 0.1 * (r - 1.0);
            if(h > maxH) return vec4(0.0);
            
            // Rotation
            float angle = atan(p.z, p.x);
            float speed = 2.0 / sqrt(r); 
            float phase = angle - u_time * speed;
            
            vec3 lp = vec3(r * cos(phase), p.y, r * sin(phase));
            float d = noise(lp * 5.0) * noise(lp * 15.0);
            
            // Color based on temp (closer = hotter/bluer)
            float t = (r - 1.0) / (u_diskSize - 1.0);
            vec3 col = mix(vec3(2.0, 1.5, 3.0), vec3(1.0, 0.3, 0.1), t);
            
            // Doppler beaming approx
            float doppler = 1.0 + 0.5 * sin(angle);
            
            float alpha = (1.0 - h/maxH) * d * 2.0;
            return vec4(col * doppler * 3.0, alpha);
        }

        // Starfield background
        vec3 background(vec3 rd) {
            float n = noise(rd * 200.0);
            vec3 stars = vec3(pow(n, 40.0)) * 5.0;
            vec3 milkyway = vec3(0.1, 0.05, 0.2) * noise(rd * 10.0 + vec3(10.0)) * noise(rd * vec3(1.0, 5.0, 1.0));
            return stars + milkyway;
        }

        void main() {
            vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution) / u_resolution.y;
            
            // Initialize ray
            vec3 ro = u_cameraPos;
            vec3 rd = u_cameraMat * normalize(vec3(uv, u_fov));
            
            vec3 col = vec3(0.0);
            float alpha = 0.0;
            
            // Raymarch with gravity bending
            float dt = 0.05;
            vec3 p = ro;
            
            float hitBH = 0.0;
            
            for(int i = 0; i < 200; i++) {
                float r2 = dot(p, p);
                float r = sqrt(r2);
                
                // Event horizon
                if(r < 0.95 * u_mass) { // Approx 1 RS
                    hitBH = 1.0;
                    break;
                }
                
                // Gravity bending: a = -GM/r^2. In GR, it's roughly 3GM/r^2 for light? We use a tuned artistic approx
                vec3 g = -p / (r2 * r) * (u_mass * 1.5);
                rd = normalize(rd + g * dt);
                
                // Sample disk
                vec4 c = diskDens(p);
                if(c.a > 0.0) {
                    c.rgb *= c.a;
                    col += c.rgb * (1.0 - alpha);
                    alpha += c.a * (1.0 - alpha);
                }
                
                if(alpha > 0.99) break;
                
                // Adaptive step size
                dt = 0.02 + 0.05 * r;
                p += rd * dt;
                
                // Escape condition
                if(r > 20.0) break;
            }
            
            if(hitBH == 0.0 && alpha < 0.99) {
                // Render infinity (Stars)
                col += background(rd) * (1.0 - alpha);
            }
            
            // Tone mapping
            col = col / (1.0 + col);
            col = pow(col, vec3(0.4545)); // Gamma
            
            gl_FragColor = vec4(col, 1.0);
        }
    `;

    function loadShader(gl, type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error(gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    }

    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, loadShader(gl, gl.VERTEX_SHADER, vsSource));
    gl.attachShader(shaderProgram, loadShader(gl, gl.FRAGMENT_SHADER, fsSource));
    gl.linkProgram(shaderProgram);
    gl.useProgram(shaderProgram);

    // Buffer for full-screen quad
    const positions = new Float32Array([-1, -1,  1, -1,  -1, 1,  1, 1]);
    const posBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
    
    const aVertLoc = gl.getAttribLocation(shaderProgram, 'aVertexPosition');
    gl.vertexAttribPointer(aVertLoc, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(aVertLoc);

    // Uniforms
    const uRes = gl.getUniformLocation(shaderProgram, 'u_resolution');
    const uTime = gl.getUniformLocation(shaderProgram, 'u_time');
    const uCamPos = gl.getUniformLocation(shaderProgram, 'u_cameraPos');
    const uCamMat = gl.getUniformLocation(shaderProgram, 'u_cameraMat');
    const uMass = gl.getUniformLocation(shaderProgram, 'u_mass');
    const uDiskSize = gl.getUniformLocation(shaderProgram, 'u_diskSize');
    const uFov = gl.getUniformLocation(shaderProgram, 'u_fov');

    let time = 0;
    
    // Camera params
    let camRotX = 0.2;
    let camRotY = 0.5;
    let fov = 1.0;
    
    let isDragging = false, lastX, lastY;
    
    canvas.addEventListener('mousedown', e => { isDragging=true; lastX=e.clientX; lastY=e.clientY; });
    window.addEventListener('mouseup', () => isDragging=false);
    window.addEventListener('mousemove', e => {
        if(!isDragging) return;
        let dx = e.clientX - lastX;
        let dy = e.clientY - lastY;
        camRotY -= dx * 0.005;
        camRotX = Math.max(-1.5, Math.min(1.5, camRotX + dy * 0.005));
        lastX = e.clientX; lastY = e.clientY;
    });
    
    canvas.addEventListener('wheel', e => {
        fov = Math.max(0.2, Math.min(3.0, fov + e.deltaY * 0.001));
    });

    // Touch
    canvas.addEventListener('touchstart', e => { if(e.touches.length===1){isDragging=true; lastX=e.touches[0].clientX; lastY=e.touches[0].clientY;} });
    canvas.addEventListener('touchmove', e => {
        if(!isDragging || e.touches.length!==1) return;
        let dx = e.touches[0].clientX - lastX;
        let dy = e.touches[0].clientY - lastY;
        camRotY -= dx * 0.005;
        camRotX = Math.max(-1.5, Math.min(1.5, camRotX + dy * 0.005));
        lastX = e.touches[0].clientX; lastY = e.touches[0].clientY;
    });
    canvas.addEventListener('touchend', () => isDragging=false);

    // UI binds
    const iMass = $('#bhMass'); const vMass = $('#valMass');
    const iDisk = $('#diskSize'); const vDisk = $('#valDisk');
    const iCam = $('#camDist'); const vCam = $('#valCam');
    
    iMass.oninput = () => vMass.textContent = parseFloat(iMass.value).toFixed(2);
    iDisk.oninput = () => vDisk.textContent = parseFloat(iDisk.value).toFixed(2);
    iCam.oninput = () => vCam.textContent = parseFloat(iCam.value).toFixed(2);

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        gl.viewport(0, 0, canvas.width, canvas.height);
    }
    window.addEventListener('resize', resize);
    resize();

    // Mat3 rotation builder
    function getCamMat(rx, ry) {
        let cx = Math.cos(rx), sx = Math.sin(rx);
        let cy = Math.cos(ry), sy = Math.sin(ry);
        // Rx * Ry
        return new Float32Array([
            cy, 0, -sy,
            -sx*sy, cx, -sx*cy,
            cx*sy, sx, cx*cy
        ]);
    }

    let lastFrame = performance.now();
    function render(now) {
        let dt = (now - lastFrame)/1000;
        lastFrame = now;
        time += dt;

        gl.uniform2f(uRes, canvas.width, canvas.height);
        gl.uniform1f(uTime, time);
        
        let dist = parseFloat(iCam.value);
        let cx = Math.sin(camRotY)*Math.cos(camRotX)*dist;
        let cy = Math.sin(camRotX)*dist;
        let cz = Math.cos(camRotY)*Math.cos(camRotX)*dist;
        gl.uniform3f(uCamPos, cx, cy, cz);
        
        gl.uniformMatrix3fv(uCamMat, false, getCamMat(-camRotX, -camRotY));
        
        gl.uniform1f(uMass, parseFloat(iMass.value));
        gl.uniform1f(uDiskSize, parseFloat(iDisk.value));
        gl.uniform1f(uFov, fov);

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
})();
