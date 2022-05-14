'use strict';
ns['system'] = new function() {
	const RenderLoop = this.RenderLoop = class extends EventEmitter {
		constructor(p = {}) {
			super();

			this.isEnabled = false;
			this.prevTime = 0;
			this.maxDiff = p.maxDiff || 1000;
			this.mindt = p.mindt || 1000 / (p.fps || 120);
		}

		start() {
			if(this.isEnabled) return;
			this.isEnabled = true;

			let _update = currentTime => {
				if(!this.isEnabled) {
					this.emit('stop');
					return;
				};

				this.dt = currentTime - this.prevTime;

				if(this.dt > this.mindt) {
					if(this.dt < this.maxDiff) this.emit('render', this.dt);
					this.prevTime = currentTime;
				};

				requestAnimationFrame(_update);
			};

			requestAnimationFrame(_update);

			this.emit('start');
		}

		stop() {
			if(!this.isEnabled) return;
			this.isEnabled = false;
		}
	};


	const MotionByTouch = this.MotionByTouch = class {
		constructor(p = {}) {
			this.fixpos = vec2();
			this.slidingSpeed = vec2();

			this.delay = p.delay || 10;
			this.maxspeed = p.maxspeed || 10;
			this.minspeed = p.minspeed || 0.02;
			this.touch = null;
		}

		update(dt, touches, vec) {
			if(!this.touch) {
				if(Math.abs(this.slidingSpeed.moduleSq) < this.minspeed) this.slidingSpeed.set(0);

				this.slidingSpeed.moveTime(Vector2.ZERO, this.delay*15 / dt);
				vec.minus(this.slidingSpeed);

				if(this.touch = touches.findTouch()) this.fixpos = vec.buf();
			} else {
				if(this.touch.isDown()) vec.set(this.fixpos.buf().minus(this.touch.dx, this.touch.dy));

				if(this.touch.isMove()) {
					this.slidingSpeed.set(
						Math.abs(this.touch.sx) <= this.maxspeed ? this.touch.sx :Math.sign(this.touch.sx)*this.maxspeed,
						Math.abs(this.touch.sy) <= this.maxspeed ? this.touch.sy :Math.sign(this.touch.sy)*this.maxspeed
					);
				};

				if(this.touch.isUp()) this.touch = null;
			};
		}
	};


	let Joystick = this.Joystick = class {
		constructor(p = {}) {
			this.pos = p.pos||vec2();
			this._angle = 0;

			this.radius = p.radius||70;
			this.coreRadius = p.coreRadius||50;
			this.colors = p.colors || [0, '#112233', 1, '#223344'];

			this.core = {
				pos: this.pos.buf(),
				radius: 30,
				coreRadius: 5,
				colors: p.coreColors || [0, '#223344', 1, '#112233']
			};

			this.touch = null;
		}

		get value() { return Math.round(this.pos.getDistance(this.core.pos) / (this.radius-this.core.radius) * 10000) / 10000; }
		get angle() { return this._angle = this.value ? this.pos.getAngleRelative(this.core.pos) : this._angle; }

		update(touches) {
			if(!this.touch) this.touch = touches.findTouch(t => this.pos.getDistance(t) < this.radius);
			else if(this.touch) {
				let l = this.pos.getDistance(this.touch);
				this.core.pos.set(this.pos).moveAngle(Math.min(l, this.radius-this.core.radius), this.core.pos.getAngleRelative(this.touch));
				if(this.touch.isUp()) this.touch = null;
			};
			if(!this.touch) this.core.pos.moveTime(this.pos, 3);
		}

		draw(ctx) {
			ctx.save();
			ctx.globalAlpha = 0.7;
			ctx.beginPath();
			let grd = ctx.createRadialGradient(this.pos.x, this.pos.y, this.coreRadius, this.pos.x, this.pos.y, this.radius);
			for(let i = 0; i < this.colors.length; i += 2) grd.addColorStop(this.colors[i], this.colors[i+1]);
			ctx.fillStyle = grd;
			ctx.arc(this.pos.x, this.pos.y, this.radius, 0, Math.PI*2);
			ctx.fill();

			ctx.beginPath();
			grd = ctx.createRadialGradient(this.core.pos.x, this.core.pos.y, this.core.coreRadius, this.core.pos.x, this.core.pos.y, this.core.radius);
			for(let i = 0; i < this.core.colors.length; i += 2) grd.addColorStop(this.core.colors[i], this.core.colors[i+1]);
			ctx.fillStyle = grd;
			ctx.arc(this.core.pos.x, this.core.pos.y, this.core.radius, 0, Math.PI*2);
			ctx.fill();
			ctx.restore();
		}
	};


	const GridMap = this.GridMap = class {
		constructor(p = {}) {
			this.offset = (p.offset || vec2()).buf();
			this.tile = (p.tile || vec2(50, 50)).buf();
			this.size = (p.size || vec2()).buf();

			this.lineWidth = p.lineWidth || 0.2;
			this.lineColor = p.lineColor || '#ffffff';
		}

		draw(ctx, pos) {
			let mar = pos.buf().mod(this.tile);
			let counts = this.size.buf().add(mar).div(this.tile); 

			ctx.save();

			// clip area
			ctx.beginPath();
			ctx.rect(this.offset.x, this.offset.y, this.size.x, this.size.y);
			ctx.clip();


			// draw grid
			ctx.beginPath();
			ctx.lineWidth = this.lineWidth;
			ctx.strokeStyle = this.lineColor;

			for(let dx = pos.x > 1 ? 1:0; dx < counts.x; dx++) {
				const x = this.offset.x - mar.x + dx*this.tile.x;
				ctx.moveTo(x, this.offset.y);
				ctx.lineTo(x, this.offset.y + this.size.y);
			};

			for(let dy = pos.y > 1 ? 1:0; dy < counts.y; dy++) {
				const y = this.offset.y - mar.y + dy*this.tile.y;
				ctx.moveTo(this.offset.x, y);
				ctx.lineTo(this.offset.x + this.size.x, y);
			};

			ctx.stroke();


			// area stroke
			ctx.beginPath();
			ctx.strokeStyle = '#44ff44';
			ctx.strokeRect(this.offset.x, this.offset.y, this.size.x, this.size.y);


			// coordinates
			let pad = vec2(10, 10);

			ctx.beginPath();
			ctx.fillStyle = '#ffff00';
			ctx.globalAlpha = 0.4;

			for(let dx = -1; dx < counts.x; dx++) {
				const coordinates = Math.floor((pos.x*1.01 + dx*this.tile.x) / this.tile.x) * this.tile.x;
				ctx.fillText(coordinates, this.offset.x + 2 - mar.x + dx*this.tile.x, this.offset.y + pad.y);
			};

			for(let dy = -1; dy < counts.y; dy++) {
				const coordinates = Math.floor((pos.y*1.01 + dy*this.tile.y) / this.tile.y) * this.tile.y;
				ctx.fillText(coordinates, this.offset.x + 2, this.offset.y + pad.y - mar.y + dy*this.tile.y);
			};

			ctx.restore();
		}
	};
};

