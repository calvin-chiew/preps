
without webgl
=============
https://github.com/gunsmoke/star-something/blob/master/js/base.js

var fixDef = new b2FixtureDef;//density, friction, restitution

var bodyDef = new b2BodyDef;//type and position

var wb = world.CreateBody(bodyDef).CreateFixture(fixDef);


with webgl
==========
pixijs chap 24 box2d integration
// create a texture from an image path
var spriteTexture = PIXI.Texture.fromImage("sprite.png");

// create a new Bunny sprite using the texture
var sprite = new PIXI.Sprite(spriteTexture);

var boxDef = new b2BoxDef();//density, friction, restitution

var bodyDef = new b2BodyDef();//shape, position, rotation

body = world.CreateBody(bodyDef);

body.m_userData = sprite;


b2FixtureDef = b2BoxDef ??
