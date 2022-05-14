'use strict';
ns['global'] = new function() {
	const { GridMap, MotionByTouch, RenderLoop } = ns['system'];


	//========== global variables ==========//
	const screenSize = this.screenSize = vec2().set(canvas.size);

	canvas.on('resize', e => {
		screenSize.set(canvas.size);

		this.globalGridMap.size.set(screenSize);
	});


	//========== global objects ==========//
	this.motionByTouch = new MotionByTouch();
	this.globalGridMap = new GridMap({ size: screenSize });


	const renderLoop = this.renderLoop = new RenderLoop();

	renderLoop.on('render', dt => Scene.update(dt));
	renderLoop.on('render', () => touches.nullify());

	loading.then(() => {
		console.log('loaded scripts (all)');

		renderLoop.start();

		Scene.run('main');
	});


	canvas.addEventListener('dblclick', e => canvas.requestFullscreen());
};

