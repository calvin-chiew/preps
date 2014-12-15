// GAME CONSTANTS

var BG_START_Y_POSITION = -1920; // Determine the start Y coordinate of the background
var ACCELERATION_STEERING_RATIO = 1.5;
var START_SPEED = -3;

var ENEMY_SHIP_SPEED = 4;

// GAME VARIABLES

var gameCanvas;
var stage, renderer;

var gameWidth, gameHeight;

var touchX, touchY;
var shipTextures, ship_graphic;
var background_texture, background, background_sprite;

var accX, accY;
var speed = 0;

var mainContainer;

var enemy_ships_container;
var enemy_ship_texture;
var enemy_ship_width;
var enemyShipsArray = [];

var projectiles_container;
var projectiles_texture;
var projectiles_array = [];

var explosions_container;
var explosion_textures;
var explosions_array = [];

var button_texture, bar_texture;
var button_sprite, bar_sprite;
var button_bar_container;

var displacementMap;

var info_text, filter_text;

var current_filter_num = 0;

var randomOccurance;

// MAIN INITIALIZATION FUNCTION
var init = function () {
	
   var assetsToLoad = ["images/starfield_small.jpg","images/enemy_ship_shadow.png","images/projectile.png","images/ship_frame_1.png","images/ship_frame_2.png","images/ship_frame_3.png","images/ship_explode_1.png","images/ship_explode_2.png","images/ship_explode_3.png","images/ship_explode_4.png","images/ship_explode_5.png","images/ship_explode_6.png","images/ship_explode_7.png","images/ship_explode_8.png","images/ship_explode_9.png","images/ship_explode_10.png","images/ship_explode_11.png","images/bar.png","images/button.png","images/tizen_logo.png"]; 
	
    // CREATE A NEW ASSET LOADER
	   loader = new PIXI.AssetLoader(assetsToLoad);
	// USE CALLBACK
	   loader.onComplete = onAssetsLoaded.bind(this);
	// BEGIN LOADING THE ASSETS
	   loader.load();
    
   function onAssetsLoaded() {
	   
    // FETCH THE CANVAS ELEMENT 
       gameCanvas = document.getElementById("myCanvas");
    
    // SET THE GAME WIDTH AND HEIGHT
       gameWidth = window.innerWidth;
       gameHeight = window.innerHeight;
    
    // CREATE A NEW PIXI.JS STAGE AND SET THE AUTOMATIC RENDERER DETECTION (WEBGL OR CANVAS)
	   stage = new PIXI.Stage(0x000000);
	   renderer = PIXI.autoDetectRenderer(gameWidth, gameHeight, gameCanvas);
	   
	// ADD AN ACCELEROMETER EVENT TO THE WINDOW OBJECT IN ORDER TO GATHER THE ACCELEROMETER DATA FROM THE DEVICE   
	   window.addEventListener("devicemotion", accelerometerUpdate, true);
 
   // ------------ PREPARE THE BACKGROUND IMAGE OF THE GAME --------------
	
	   background_texture = PIXI.Texture.fromImage("images/starfield_small.jpg");
	   background_sprite = new PIXI.Sprite(background_texture);
	   
	   background = new PIXI.DisplayObjectContainer();
	   background.x = 0;
	  
	   background_sprite.anchor.x = 0;
	   background_sprite.anchor.y = 0;
	   
	   background.position.y = BG_START_Y_POSITION;
	
	   background.addChild(background_sprite);
	
   // ------------ ACQUIRE THE SHIPS TEXTURES FROM PNG IMAGES AND BUILD FROM THEM A PIXI.JS MOVIECLIP --------------------
	   
	   var ship_texture = [PIXI.Texture.fromImage("images/ship_frame_1.png"), PIXI.Texture.fromImage("images/ship_frame_2.png"), PIXI.Texture.fromImage("images/ship_frame_3.png"), PIXI.Texture.fromImage("images/ship_frame_2.png")];
	   	   ship_graphic = new PIXI.MovieClip(ship_texture);
	
		   ship_graphic.animationSpeed = 0.5; // DEFAULT IS 1
		   ship_graphic.loop = true;
		   ship_graphic.play();
		  
   // ------------ CENTER THE SHIPS' ANCHOR POINT ---------------
   
		   ship_graphic.anchor.x = 0.5;
		   ship_graphic.anchor.y = 0.5;
	
   // ------------ SET THE SHIP IN THE DOWN-MIDDLE PART OF THE SCREEN AT THE START OF THE GAME ---------
	   
		   ship_graphic.position.x = gameWidth * 0.5;
		   ship_graphic.position.y = gameHeight * 0.65;
		   
   // ------------ ACQUIRE THE ENEMY SHIP TEXTURE -------------
		   
		   enemy_ship_texture = PIXI.Texture.fromImage("images/enemy_ship_shadow.png");
		   enemy_ship_width = enemy_ship_texture.width;
	   
   // ------------ PREPARE THE EXPLOSIONS ANIMATION ATLAS TEXTURES -------------
		   
	       explosion_textures = [PIXI.Texture.fromImage("images/ship_explode_1.png"), PIXI.Texture.fromImage("images/ship_explode_2.png"), PIXI.Texture.fromImage("images/ship_explode_3.png"), PIXI.Texture.fromImage("images/ship_explode_4.png"), PIXI.Texture.fromImage("images/ship_explode_5.png"), PIXI.Texture.fromImage("images/ship_explode_6.png"), PIXI.Texture.fromImage("images/ship_explode_7.png"), PIXI.Texture.fromImage("images/ship_explode_8.png"), PIXI.Texture.fromImage("images/ship_explode_9.png"), PIXI.Texture.fromImage("images/ship_explode_10.png"), PIXI.Texture.fromImage("images/ship_explode_11.png")];
		   	   
   // ------------ ACQUIRE THE CHANGE FILTER BUTTON AND DOWN BAR TEXTURES ---------------
		     
		   button_texture = PIXI.Texture.fromImage("images/button.png");
		   bar_texture = PIXI.Texture.fromImage("images/bar.png");
		   
   // ------------ ACQUIRE THE PROJECTILES TEXTURE -------------
	   
		   projectiles_texture = PIXI.Texture.fromImage("images/projectile.png");
		   
   // ------------ ACQUIRE THE DISPLACEMENT MAP USED IN THE DISPLACEMENT FILTER --------------
		   
		   displacementMap = PIXI.Texture.fromImage("images/tizen_logo.png");
		   
   // ------------ SETUP THE ENEMY SHIP CLASS OBJECT  ------------ 
	   
	   function EnemyShip(_x,_y) {

		   this.xPos = _x;
		   this.yPos = _y;
		   
		   this.isAlive = true;
		   this.angle = 0;
		   
		   this.texture = enemy_ship_texture;
		   this.enemy_ship_graphic = new PIXI.Sprite(this.texture);
		   
		   this.enemy_ship_graphic.position.x = this.xPos;
		   this.enemy_ship_graphic.position.y = this.yPos;
		   
		   enemy_ships_container.addChild(this.enemy_ship_graphic);
		   
			   this.getX = function() {
				   return this.enemy_ship_graphic.position.x;
			   }
			   
			   this.getY = function() {
				   return this.enemy_ship_graphic.position.y;
			   }
			   
			   this.getWidth = function() {
				   return this.enemy_ship_graphic.width;
			   }
			   
			   this.getHeight = function() {
				   return this.enemy_ship_graphic.height;
			   }
	   }
	   
	   EnemyShip.prototype.move = function(_speed) {

		   if (this.isAlive) {
		   
			   this.enemy_ship_graphic.position.y += _speed;
			   this.enemy_ship_graphic.position.x = this.xPos + Math.sin(this.angle) * 20;
			   this.angle += 0.1;
			      
			   if (this.enemy_ship_graphic.position.y > gameHeight) {
				   this.isAlive = false;
				   this.killShip();     
			   } 
		   }
	   }
	   
	   EnemyShip.prototype.killShip = function() {
		
			       enemy_ships_container.removeChild(this.enemy_ship_graphic);
				   
			   var enemyArrPos = enemyShipsArray.indexOf(this);
		
			   	   enemyShipsArray.splice(enemyArrPos,1);
	   }
	   
	   
	// ------------- SETUP AN EXPLOSION CLASS OBJECT -------------
	   
	   	function Explosion(_x,_y) {
			   
			   this.xPos = _x;
			   this.yPos = _y;
			   
			   this.isAlive = true;
			   
			   this.texture = explosion_textures;
			   this.explosion_graphic = new PIXI.MovieClip(this.texture);
			   
			   this.explosion_graphic.anchor.x = 0.5;
			   this.explosion_graphic.anchor.y = 0.5;
			   
			   this.explosion_graphic.position.x = this.xPos;
			   this.explosion_graphic.position.y = this.yPos;
			   
			   this.explosion_graphic.animationSpeed = 0.5; // DEFAULT IS 1
			   this.explosion_graphic.loop = false;
			   this.explosion_graphic.play();		   
			   
			   explosions_container.addChild(this.explosion_graphic);
			   
			// >>>>>>>> a workaround using setTimeout method to destroy explosion animations <<<<<<<<<
			   
				   var explosion = this.explosion_graphic;
				   var that = this;
				   
				   setTimeout(function(){  
	
					   	   explosions_container.removeChild(explosion);
					
					   var explosionPos = explosions_array.indexOf(that);	
					   	   explosions_array.splice(explosionPos,1);
				
				   }, 1500);
			   
		    // ************************************************************
				   
				   this.getX = function() {
					   return this.explosion_graphic.position.x;
				   }
				   
				   this.getY = function() {
					   return this.explosion_graphic.position.y;
				   }
				   
				   this.getWidth = function() {
					   return this.explosion_graphic.width;
				   }
				   
				   this.getHeight = function() {
					   return this.explosion_graphic.height;
				   }
		   }
 
	// ------------- SETUP THE PROJECTILE GAME OBJECT -------------
	   
	   function Projectile(_x,_y) {
	
			   this.xPos = _x;
			   this.yPos = _y;
			   
			   this.isAlive = true;
			   
			   this.texture = projectiles_texture;
			   this.projectile_graphic = new PIXI.Sprite(this.texture);
			   
			   this.projectile_graphic.position.x = this.xPos;
			   this.projectile_graphic.position.y = this.yPos;
			   
			   projectiles_container.addChild(this.projectile_graphic);
			   
				   this.getX = function() {
					   return this.projectile_graphic.position.x;
				   }
				   
				   this.getY = function() {
					   return this.projectile_graphic.position.y;
				   }
				   
				   this.getWidth = function() {
					   return this.projectile_graphic.width;
				   }
				   
				   this.getHeight = function() {
					   return this.projectile_graphic.height;
				   }
		   }
		   
		   Projectile.prototype.move = function(_speed) {

			   if (this.isAlive) {
			   
				   this.projectile_graphic.position.y -= _speed;
				   
				   if (this.projectile_graphic.position.y < 0 - this.projectile_graphic.height - 5) { // kill the projectile when it reaches the upper border of the screen	   
					   
					   this.isAlive = false;
					   this.kill();
					     
				   }
				   
			   }

		   }
		   
		   Projectile.prototype.kill = function() {

				   projectiles_container.removeChild(this.projectile_graphic);
			
			   var projectileArrPos = projectiles_array.indexOf(this);
			   	   projectiles_array.splice(projectileArrPos, 1);
			  
		   }
		    
	// ------------- ADD THE SPRITES TO THE GAME STAGE (WE ARE BUILDING HERE THE LAYERS OF OUR GAME) STARTING FROM THE BOTTOM TO THE TOP -------------
	
			   mainContainer = new PIXI.DisplayObjectContainer();
			   stage.addChild(mainContainer);
			   
			   	   mainContainer.addChild(background);
			   
				   projectiles_container =  new PIXI.DisplayObjectContainer();
				   mainContainer.addChild(projectiles_container);
				   
				   mainContainer.addChild(ship_graphic);
				   
				   enemy_ships_container = new PIXI.DisplayObjectContainer();
				   mainContainer.addChild(enemy_ships_container);
				   
				   explosions_container = new PIXI.DisplayObjectContainer();
				   mainContainer.addChild(explosions_container);
				   
				   button_bar_container = new PIXI.DisplayObjectContainer();
				   stage.addChild(button_bar_container);
				   
				   button_sprite = new PIXI.Sprite(button_texture);
				   bar_sprite = new PIXI.Sprite(bar_texture);
				   
				   button_sprite.position.x = 35;
				   button_sprite.position.y = gameHeight - button_sprite.height - 10;
				   
				   button_sprite.setInteractive(true);
				   button_sprite.tap = nextFilter;
				   
				   bar_sprite.position.y = gameHeight - bar_sprite.height;
				   
				   info_text = new PIXI.Text("TAP TO CHANGE THE FILTER", {font:"10px Arial", fill:"black"});
				   info_text.position.y = gameHeight - button_sprite.height - 30;
				   info_text.position.x = 5;
				   
				   filter_text = new PIXI.Text(" ", {font:"16px Arial", fill:"black", align:"center"});
				   filter_text.position.y = gameHeight - 55;
				   filter_text.position.x = 160;
				   
				   button_bar_container.addChild(bar_sprite);
				   button_bar_container.addChild(button_sprite);
				   button_bar_container.addChild(info_text);
				   button_bar_container.addChild(filter_text);
	
	// ********* PIXI.JS WEBGL FILTER MANAGMENT ************
	
			   changeFilter(0); // SET THE FIRST FILTER TO APPLY TO THE GAME (NO FILTER)
			   
		   function nextFilter() { // THIS FUNCTION ROTATES THROUGH OUR FILTERS
				
			    if (current_filter_num < 10) {
					current_filter_num++;
				}   
				else {
					current_filter_num = 0;
				}
			   
			    changeFilter(current_filter_num);
				
		   }   
		
		   
		   function changeFilter(_filterNumber) {  // HERE WE CHOOSE OUR WEBGL FILTERS
		
			   switch(_filterNumber) {
			   
				   case 0:
					   		   mainContainer.filters = null; // <-- you dismiss the filters by assigning null :)
					   		   
					   		   filter_text.setText("No filters");
				   break;
			   
				   case 1:
						   var grayFilter = new PIXI.GrayFilter();
						   	   mainContainer.filters = [grayFilter];
						   	   
						   	   filter_text.setText("PIXI.GrayFilter();");
				   break;
				   
				   case 2:
					  
						   var pixelateFilter = new PIXI.PixelateFilter();
						   	   pixelateFilter.size = new PIXI.Point(5, 5);
					   	       mainContainer.filters = [pixelateFilter];
					   	       
					   	       filter_text.setText("PIXI.PixelateFilter();");
				   break;
				   
				   case 3:
						   var dotScreenFilter = new PIXI.DotScreenFilter();
							   dotScreenFilter.scale = 5;
							   dotScreenFilter.angle = deg2rad(90);
						   	   mainContainer.filters = [dotScreenFilter];
						   	   
						       filter_text.setText("PIXI.DotScreenFilter();");	       
				   break;
				   
				   case 4:
						   var invertFilter = new PIXI.InvertFilter();
						   	   mainContainer.filters = [invertFilter]; 
						   	   
						   	  filter_text.setText("PIXI.InvertFilter();");	   	  
				   break;
				   
				   case 5:
						   var blurFilter = new PIXI.BlurFilter();
						       blurX = 10;
						       blurY = 10;
					   	       mainContainer.filters = [blurFilter];
					   	       
					   	       filter_text.setText("PIXI.BlurFilter();");  	       
				   break;
				   
				   case 6:
						   var sepiaFilter = new PIXI.SepiaFilter();
						   	   mainContainer.filters = [sepiaFilter];
						   	   
						   	   filter_text.setText("PIXI.SepiaFilter();");   	   
				   break;
				   
				   case 7:
						   var twistFilter = new PIXI.TwistFilter();
						   	   mainContainer.filters = [twistFilter];
						   	   
						   	   filter_text.setText("PIXI.TwistFilter();");   	   
				   break;
				   
				   case 8:
						   var colorMatrixFilter = new PIXI.ColorMatrixFilter();
						   	   colorMatrixFilter.matrix = [0,0,0,0,
						   	                               0,1,1,0,
						   	                               0,0,0,0,
						   	                               0,0,0,1];
						       mainContainer.filters = [colorMatrixFilter];
						       
						       filter_text.setText("PIXI.ColorMatrixFilter();");	       
				   break;
				   
				   case 9:
					   
						   var colorMatrixFilter = new PIXI.ColorMatrixFilter();
						   	   colorMatrixFilter.matrix = [1,1,0,0,
						   	                               0,0,0,0,
						   	                               0,0,0,0,
						   	                               0,0,0,1];
					       
					       var pixelateFilter = new PIXI.PixelateFilter();
					       	   pixelateFilter.size = new PIXI.Point(5, 5);
					   	   
					   	       mainContainer.filters = [pixelateFilter,colorMatrixFilter];
					   	    
						       filter_text.setText("PIXI.ColorMatrixFilter();\nPIXI.PixelateFilter();");	      
					   
				   break;
				   
				   case 10:
					   
						   var displacementFilter = new PIXI.DisplacementFilter(displacementMap);
						   	   displacementFilter.offset = new PIXI.Point(20,20);
						       displacementFilter.scale = new PIXI.Point(10,10);
						   	   
						   	   mainContainer.filters = [displacementFilter];
						       
						       filter_text.setText("PIXI.DisplacementFilter();");
				   break;   
				  		   
			   }	      
		   }		 
   
   // *******************************************
	   
		   //// ON THE TOP OF OUR SCENE WE PUT A FPS COUNTER FROM MR.DOOB - stats.js ////
		   
			   var stats = new Stats();
				   stats.setMode(0); // 0: fps, 1: ms
				
				    // Align to the top-left
					   stats.domElement.style.position = 'absolute';
					   stats.domElement.style.left = '0px';
					   stats.domElement.style.top = '0px';
					   
					   document.body.appendChild( stats.domElement );
			   
		   ////////////////////////////////////////////////////
  
   // ********* THE MAIN GAME LOOP STARTS HERE *********
	   
    draw(); // START UP THE DRAWING OF OUR GAME
    
    function draw() { 
    	stats.begin(); // THE BEGINNING POINT OF stats.js FPS PERFORMANCE COUNTER
    	
    	if (accX != null) ship_graphic.position.x -= accX; // reverse X order
    	if (accY != null) ship_graphic.position.y += accY;
    	
    	    speed = START_SPEED + (ship_graphic.position.y - gameHeight) * 0.05; 
    	
    	if (accY != null) background.position.y -= START_SPEED;
    	
    	background.position.y -= speed * 0.5;
      
     // CHECK IF THE PLAYERS SHIP DOESN'T GO OUT OF THE BORDERS OF THE SCREEN	
    	
    	if (ship_graphic.position.x > gameWidth) {
    		ship_graphic.position.x = gameWidth;
    	}
    	
    	if (ship_graphic.position.y > gameHeight - bar_sprite.height - 20) {
    		ship_graphic.position.y = gameHeight - bar_sprite.height - 20;
    	}
    	
    	if (ship_graphic.position.x < 0) {
			ship_graphic.position.x = 0;
    	}
    
    	if (ship_graphic.position.y < gameHeight/2 - 50) { // we want the ship to move only on the lower half of the screen
			ship_graphic.position.y = gameHeight/2 - 50;
    	}
    	
    // ROTATE THE SHIP WHILE TURNING USING THE ACCELEROMETERS ACCELERATION
    	
    	ship_graphic.rotation = 2 * -deg2rad(accX);
    	
    	if (background.position.y > 0) {
    		background.position.y = BG_START_Y_POSITION;
    	}
    	
    // GENERATE NEW ENEMY SHIP PSEUDO RANDOMLY IN A PSEUDO RANDOM X POSITION WITHIN THE GAMEWIDTH = window.innerWidth;
    	
    	   randomOccurance = Math.round(Math.random() * 100);
    	   
    	   if (randomOccurance == 50) {
    		    
    		  var random_ship_x = Math.round(Math.random() * (gameWidth - enemy_ship_width)); // generate a pseudo random X starting point		  
    		  var enemyShip = new EnemyShip(random_ship_x, -100);  // generate an enemy ship above the visible game area (-100)
    		   
    		  	  enemyShipsArray.push(enemyShip);
    	   }
    	   
    	
    // MOVE ALL THE Y COORDINATES OF THE SHIPS IN THE ENEMY SHIPS ARRAY
    	
    	   for (var i=0; i < enemyShipsArray.length; i++) {	   
    		   enemyShipsArray[i].move(ENEMY_SHIP_SPEED - speed * 0.25);	   
    	   }
    	   
    // DECREMENT (MOVE OPPOSITE WAY TO THE ENEMY SHIPS) ALL THE Y VALUES OF THE PROJECTILES IN THE PROJECTILES ARRAY
       	
    	   for (var p=0; p < projectiles_array.length; p++) {
    		   projectiles_array[p].move(10);
    	   }
    	   
    // CHECK COLLISIONS BETWEEN PROJECTILES AND ENEMY SHIPS WITH A SIMPLE BOUNDING BOX OVERLAP HIT TEST
    	
    	   var x1,y1,w1,h1;
    	   var x2,y2,w2,h2;
    	   
    	   for (var z=0; z < projectiles_array.length; z++) {
    		   
    		   for (var v=0; v < enemyShipsArray.length; v++) {
    			   
    			   if (projectiles_array[z] != null && enemyShipsArray[v] != null) {
    			   
    			// ACQUIRE THE COORDINATES FROM ALL THE ENEMY SHIPS AND FIRED PROJECTILES TO PERFORM THE HIT TEST	   
    				   
    			   if (projectiles_array[z].getX() != null) x1 = projectiles_array[z].getX();
    			   if (projectiles_array[z].getY() != null) y1 = projectiles_array[z].getY();
    			   if (projectiles_array[z].getWidth() != null) w1 = projectiles_array[z].getWidth();
    			   if (projectiles_array[z].getHeight() != null) h1 = projectiles_array[z].getHeight();
    			   
    			   if (enemyShipsArray[v].getX() != null) x2 = enemyShipsArray[v].getX();
    			   if (enemyShipsArray[v].getY() != null) y2 = enemyShipsArray[v].getY();
    			   if (enemyShipsArray[v].getWidth() != null) w2 = enemyShipsArray[v].getWidth();
    			   if (enemyShipsArray[v].getHeight() != null) h2 = enemyShipsArray[v].getHeight();
    			   
    			// PERFORM THE HIT TEST
    			   
	    			   if (hitTest(x1,y1,w1,h1,x2,y2,w2,h2) == true) { 
	    				   
	    				   if (projectiles_array[z] != null) projectiles_array[z].kill();
	    				   if (enemyShipsArray[v] != null) enemyShipsArray[v].killShip();
	    				   
	    				   var explosion = new Explosion(x2 + 40, y2 + 40); // add an explosion of the enemy ship to the explosions display object container
	    				   	   explosions_array.push(explosion);	   
	    			   }
    			   } 
        	   }
    	   }
    	   
    	renderer.render(stage); // RENDER THE Pixi.js STAGE
    	requestAnimationFrame(draw); // CALL AGAIN THE draw() FUNCTION IN ORDER TO DRAW THE NEXT FRAME OF OUR GAME
    	stats.end(); // THE END POINT OF stats.js FPS COUNTER
    	
    }
   
    mainContainer.setInteractive(true); // YOU NEED TO SET THIS TO TRUE IF YOU WANT INTERACTIVITY (tapping, clicking, etc...)
    mainContainer.tap = function(tapData) {
    	
    	var localCoords = tapData.getLocalPosition(mainContainer); // RETRIEVE THE TAPPING COORDINATES FROM THE DEVICE ON THE mainContainer DisplayObject
    
	    	touchY = localCoords.y; 
	    	
	    	if (touchY < gameHeight - bar_sprite.height) { // WE ONLY WANT TO BE ABLE TO TAP (SHOOT) ABOVE THE BAR WITH FILTERS
		    	var fired_projectile = new Projectile(ship_graphic.position.x - 5, ship_graphic.position.y - 40);
		    		projectiles_array.push(fired_projectile);
	    	}
    	}
    
    // THE ACCELEROMETER UPDATE FUNCTION
	    function accelerometerUpdate(e) {
	    	   accX = event.accelerationIncludingGravity.x * ACCELERATION_STEERING_RATIO;
	    	   accY = event.accelerationIncludingGravity.y * ACCELERATION_STEERING_RATIO;
	    }
    
    // *************** HELPER FUNCTIONS *****************

	    // A DEGREES TO RADIAN CONVERTER FUNCTION
	    function deg2rad(_deg) {
	    	var pi = Math.PI;
	    	var de_ra = (_deg)*(pi/180);
	    	
	    	return de_ra;
	    }
	    
	    // A FUNCTION TO CHECK OBJECT HITTEST BY SIMPLE BOUNDING BOX OVERLAPPING
	    function hitTest(x1, y1, w1, h1, x2, y2, w2, h2)
		{
		    if (x1 + w1 > x2)
		        if (x1 < x2 + w2)
		            if (y1 + h1 > y2)
		                if (y1 < y2 + h2)
		                	return true;
	
		    return false;
		};
    
	// **************************************************
	
    // ADD EVENTLISTENER FOR TIZENHWKEY
    document.addEventListener('tizenhwkey', function(e) {
        if(e.keyName == "back")
            tizen.application.getCurrentApplication().exit();
    });
    
   }
    
};

// WINDOW.ONLOAD IS ASSIGNING OUR MAIN INIT FUNCTION TO THE ONLOAD EVENT
window.onload = init;

