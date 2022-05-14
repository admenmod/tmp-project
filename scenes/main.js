'use strict';
Scene.create('main', function() {
	const { GridMap, MotionByTouch } = ns['system'];
	const { screenSize, globalGridMap, motionByTouch } = ns['global'];


	const systemInfoDrawObject = ns['global'].systemInfoDrawObject = {
		textFPS: '',
		textScreenSize: '',

		padding: vec2(10, 10),
		time: 0,
		
		update(dt) {
			if(this.time > 100) {
				this.textFPS = `FPS: ${(1000/dt).toFixed(2)}`;
				this.textScreenSize = `Screen size: ${screenSize.x}, ${screenSize.y}`;

				this.time = 0;
			};

			this.time += dt;
		},

		draw(ctx) {
			ctx.save();
			ctx.beginPath();

			ctx.font = `18px arkhip, Arial`;
			ctx.textBaseline = 'top';

			ctx.strokeStyle = '#111111';
			ctx.strokeText(this.textFPS, this.padding.x, this.padding.y);
			ctx.fillStyle = '#eeeeee';
			ctx.fillText(this.textFPS, this.padding.x, this.padding.y);


			ctx.textAlign = 'end';
			ctx.textBaseline = 'bottom';

			ctx.strokeStyle = '#111111';
			ctx.strokeText(this.textScreenSize, screenSize.x - 10, screenSize.y - 10);
			ctx.fillStyle = '#eeeeee';
			ctx.fillText(this.textScreenSize, screenSize.x - 10, screenSize.y - 10);

			ctx.restore();
		}
	};


	console.log(`Initialize scene "${this.name}"`);


	//========== Init ==========//
	this.init = () => {
		console.log(`Scene: ${this.name}\nScreen size: ${screenSize.x}, ${screenSize.y}`);
	};


	//========== Update ==========//
	this.update = dt => {
		motionByTouch.update(dt, touches, layers.main.camera);

		layers.main.ctx.clearRect(0, 0, screenSize.x, screenSize.y);

		globalGridMap.draw(layers.main.ctx, layers.main.camera);


		systemInfoDrawObject.update(dt);
		systemInfoDrawObject.draw(layers.main.ctx);
	};


	//========== Exit ==========//
	this.exit = () => {
		console.log(this.name, 'exit');
	};
});

