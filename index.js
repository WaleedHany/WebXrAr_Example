import * as THREE from "three"

// global scene values
var btn, gl, glCanvas, camera, scene, renderer, cube;

// global xr value
var xrSession = null;

function loadScene() 
{
    // setup the WebGL context and the components of a Three.js scene
    glCanvas = document.createElement('canvas')
    gl = glCanvas.getContext('webgl', { antialias: true })

    // setup Three.js scene
    camera = new THREE.PerspectiveCamera(
        70,
        window.innerWidth / window.innerHeight,
        0.01,
        1000
        )
    scene = new THREE.Scene()
    scene.add(camera)

    // geometry and material objects
    var geometry = new THREE.BoxBufferGeometry(0.2, 0.2, 0.2)
    var material = new THREE.MeshPhongMaterial({color: 0x89CFF0})
    cube = new THREE.Mesh( geometry, material )
    scene.add( cube )

    // add light
    var light = new THREE.HemisphereLight( 0xffffff, 0xbbbbff, 1 )
    light.position.set( 0.5, 1, 0.25 )
    scene.add( light )

    // set up our WebGLRenderer.
    renderer = new THREE.WebGLRenderer({
        canvas: glCanvas,
        context: gl
    });
    renderer.setPixelRatio( window.devicePixelRatio )
    renderer.setSize( window.innerWidth, window.innerHeight )
    renderer.xr.enabled = true
    document.body.appendChild( renderer.domElement )
}

function init() 
{
    // kickoff the execution of the script
    navigator.xr.isSessionSupported('immersive-ar').then((supported) => {
        if (supported) 
        {
            // create button element to advertise XR
            btn = document.createElement("button")
            // add 'click' event listener to button
            btn.addEventListener('click', onRequestSession)
            btn.innerHTML = "Enter XR"
            var header = document.querySelector("header")
            header.appendChild(btn)
        }
        else 
        {
            // create fallback session
            navigator.xr.isSessionSupported('inline').then((supportInline) => {
            if (supportInline) 
            {
                console.log('inline sessionsupported')
            }
            else 
            {
                console.log('inline notsupported')}
            })
        }
    }).catch((reason) => 
    {
        console.log('WebXR not supported: ' + reason)
    })
}

function onRequestSession() 
{
    // handle the XR session request
    console.log("requesting session")
    navigator.xr.requestSession('immersive-ar',{requiredFeatures: ['viewer', 'local']}).then(onSessionStarted)
    .catch((reason) => {
        console.log('request disabled: ' + reason.log)
    })
}

function onSessionStarted(session) 
{
    // handle the XR session once it has been created
    btn.removeEventListener('click', onRequestSession)
    btn.addEventListener('click', endXRSession)
    btn.innerHTML = "STOP AR";
    xrSession = session;
    // connect the WebGL context to the XR session
    setupWebGLLayer().then(()=> {
        // Set the XR Session???s Reference Space for AR
        renderer.xr.setReferenceSpaceType('local')
        // setSession(xrSession)
        renderer.xr.setSession(xrSession)
        // start the animation loop
        animate()
    })
}

function setupWebGLLayer() 
{
    // connect the WebGL context to the XR session
    return gl.makeXRCompatible().then(() => {
        // set the value of an XR session???s baseLayer to a new XRWebGLLayer
        xrSession.updateRenderState(
        {
            // connect the XR session with the WebGL context
            baseLayer: new XRWebGLLayer(xrSession, gl)
        });
    });
}

function animate() 
{
    // begin the animation loop
    renderer.setAnimationLoop(render)
}

function render(time) 
{
    // issue the draw command to the GPU
    renderer.render(scene, camera)
}

function endXRSession() 
{
    // terminate the XR session
    if (xrSession) 
    {
        console.log('ending session...')
        xrSession.end().then(onSessionEnd)
    } 
}

function onSessionEnd() 
{
    // handle the 'end' event of the XR session
    xrSession = null
    console.log('session ended')
    btn.innerHTML = "START AR"
    btn.removeEventListener('click', endXRSession)
    btn.addEventListener('click', onRequestSession)
}