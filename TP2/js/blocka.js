document.addEventListener('DOMContentLoaded', () => {
	const canvas = document.getElementById('canvasBlocka');
	if (!canvas) return console.warn('No se encontró canvas #canvasBlocka');
	const ctx = canvas.getContext('2d');

	// Lista de 10 imágenes (ruta absoluta tal como se usan en el HTML)
	const IMAGES = [
		'/Interfaces-de-Usuario/TP2/assets/img/17073_3.jpg',
		'/Interfaces-de-Usuario/TP2/assets/img/252578_3.jpg',
		'/Interfaces-de-Usuario/TP2/assets/img/254334_3.jpg',
		'/Interfaces-de-Usuario/TP2/assets/img/251922_3.jpg',
		'/Interfaces-de-Usuario/TP2/assets/img/250888_3.jpg',
		'/Interfaces-de-Usuario/TP2/assets/img/254590_3.jpg',
		'/Interfaces-de-Usuario/TP2/assets/img/254564_3.jpg',
		'/Interfaces-de-Usuario/TP2/assets/img/254518_3.jpg',
		'/Interfaces-de-Usuario/TP2/assets/img/221505_3.jpg',
		'/Interfaces-de-Usuario/TP2/assets/img/250830_3.jpg'
	];

	// offscreen thumb canvases
	const thumbs = [];
	let currentRotation = 0; // radians
	let spinning = false;
	let selectedIndex = -1;

	function createOffscreen(w,h){
		const c = document.createElement('canvas');
		c.width = w; c.height = h; return c;
	}

	function loadImage(src){
		return new Promise((resolve,reject)=>{
			const img = new Image(); img.crossOrigin='anonymous';
			img.onload = ()=>resolve(img); img.onerror = ()=>reject(new Error('Error cargando '+src)); img.src = src;
		});
	}

	// prepare thumbnails as offscreen canvases with ImageData manipulation
	async function prepareThumbs(){
		thumbs.length = 0;
		const N = IMAGES.length;
		// thumbnail size based on canvas
		const base = Math.min(canvas.width, canvas.height);
		const thumbW = Math.round(base * 0.18); // relative size
		const thumbH = Math.round(base * 0.12);

		for(let i=0;i<N;i++){
			try{
				const img = await loadImage(IMAGES[i]);
				const off = createOffscreen(thumbW, thumbH);
				const offCtx = off.getContext('2d');
				// cover scale
				const ratio = Math.max(thumbW / img.width, thumbH / img.height);
				const dw = Math.ceil(img.width * ratio);
				const dh = Math.ceil(img.height * ratio);
				const dx = Math.floor((thumbW - dw)/2);
				const dy = Math.floor((thumbH - dh)/2);
				offCtx.drawImage(img, 0,0, img.width, img.height, dx, dy, dw, dh);
				// apply small desaturate via ImageData (demo)
				const id = offCtx.getImageData(0,0,thumbW,thumbH);
				const d = id.data;
				for(let p=0;p<d.length;p+=4){
					const r=d[p], g=d[p+1], b=d[p+2];
					const lum = 0.299*r + 0.587*g + 0.114*b;
					d[p] = Math.round(r*0.75 + lum*0.25);
					d[p+1] = Math.round(g*0.75 + lum*0.25);
					d[p+2] = Math.round(b*0.75 + lum*0.25);
				}
				offCtx.putImageData(id,0,0);
				thumbs.push(off);
			}catch(err){
				console.error(err);
				const off = createOffscreen(120,80); const octx = off.getContext('2d');
				octx.fillStyle='#333'; octx.fillRect(0,0,off.width,off.height);
				octx.fillStyle='#fff'; octx.fillText('err',8,20);
				thumbs.push(off);
			}
		}
	}

	function drawRoulette(rotation){
		const W = canvas.width, H = canvas.height;
		ctx.clearRect(0,0,W,H);
		// background
		ctx.fillStyle = '#071025'; ctx.fillRect(0,0,W,H);

		const cx = W/2, cy = H/2;
		const radius = Math.min(W,H)/2 - Math.max(thumbs[0].width, thumbs[0].height) - 10;
		const N = thumbs.length;
		const step = (Math.PI*2)/N;

		// draw each thumb at angle = rotation + i*step
		for(let i=0;i<N;i++){
			const angle = rotation + i*step;
			const tx = cx + Math.cos(angle) * radius;
			const ty = cy + Math.sin(angle) * radius;
			const thumb = thumbs[i];
			ctx.save();
			// rotate so the top of the thumb faces outward
			ctx.translate(tx,ty);
			ctx.rotate(angle + Math.PI/2);
			// draw centered
			ctx.drawImage(thumb, -thumb.width/2, -thumb.height/2, thumb.width, thumb.height);
			ctx.restore();
		}

		// draw center marker
		ctx.beginPath(); ctx.fillStyle='rgba(255,255,255,0.06)'; ctx.arc(cx,cy, radius-24, 0, Math.PI*2); ctx.fill();

		// highlight selected index at top (angle = -PI/2)
		if(selectedIndex>=0){
			const selectAngle = -Math.PI/2;
			const sx = cx + Math.cos(selectAngle) * radius;
			const sy = cy + Math.sin(selectAngle) * radius;
			// draw border around selected thumb area
			ctx.beginPath(); ctx.strokeStyle='rgba(255,255,255,0.9)'; ctx.lineWidth=4;
			const sthumb = thumbs[selectedIndex];
			ctx.save(); ctx.translate(sx,sy); ctx.rotate(selectAngle+Math.PI/2);
			ctx.strokeRect(-sthumb.width/2 -4, -sthumb.height/2 -4, sthumb.width+8, sthumb.height+8);
			ctx.restore();
		}

		// top pointer
		ctx.fillStyle='rgba(255,255,255,0.9)';
		ctx.beginPath(); ctx.moveTo(cx-8, cy - radius - 6); ctx.lineTo(cx+8, cy - radius - 6); ctx.lineTo(cx, cy - radius + 8); ctx.closePath(); ctx.fill();
	}

	// easing
	function easeOutCubic(t){ return 1 - Math.pow(1-t,3); }

	let spinAnim = null;
	function spinToRandom(){
		if(spinning || thumbs.length===0) return;
		spinning = true; selectedIndex = -1;
		const N = thumbs.length; const step = (Math.PI*2)/N;
		const target = Math.floor(Math.random()*N);
		// want target to land at -PI/2
		const current = currentRotation;
		// compute angle of target currently: angle_target = current + target*step
		const angleTargetNow = current + target*step;
		// compute needed delta so that angleTargetNow + delta = -PI/2 + spins*2PI
		const spins = 3 + Math.floor(Math.random()*3); // between 3 and 5 spins
		const finalAngle = -Math.PI/2 + spins * Math.PI * 2;
		const delta = finalAngle - angleTargetNow;
		const duration = 2600 + Math.floor(Math.random()*1200);
		const start = performance.now();

		function stepAnim(now){
			const t = Math.min(1, (now - start)/duration);
			const eased = easeOutCubic(t);
			currentRotation = current + delta * eased;
			drawRoulette(currentRotation);
			if(t<1){ spinAnim = requestAnimationFrame(stepAnim); }
			else {
				cancelAnimationFrame(spinAnim); spinAnim = null; spinning = false;
				// compute selected index based on final rotation
				const normalized = ((currentRotation % (Math.PI*2)) + Math.PI*2) % (Math.PI*2);
				// index whose angle equals -PI/2 -> solve for i: normalized + i*step = (2pi - PI/2) mod 2pi? simpler compute nearest
				let nearest = 0; let bestDiff = Infinity;
				for(let i=0;i<N;i++){
					const ang = (normalized + i*step) % (Math.PI*2);
					// map ang relative to selection (-PI/2 mod 2pi)
					const sel = ((-Math.PI/2 % (Math.PI*2)) + Math.PI*2) % (Math.PI*2);
					const diff = Math.abs(((ang - sel + Math.PI*3) % (Math.PI*2)) - Math.PI);
					if(diff < bestDiff){ bestDiff = diff; nearest = i; }
				}
				selectedIndex = nearest;
				drawRoulette(currentRotation);
			}
		}
		spinAnim = requestAnimationFrame(stepAnim);
	}

	// initialize
	(async ()=>{
		await prepareThumbs();
		drawRoulette(currentRotation);
		// click on canvas to spin
		canvas.style.cursor = 'pointer';
		canvas.addEventListener('click', ()=> spinToRandom());
	})();

	// no-op resize handler kept for symmetry
	window.addEventListener('resize', ()=>{});
});
