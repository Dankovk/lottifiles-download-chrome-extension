

// worker string
const workerString = `

// gif.worker.js 0.2.0 - https://github.com/jnordberg/gif.js
(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){var NeuQuant=require("./TypedNeuQuant.js");var LZWEncoder=require("./LZWEncoder.js");function ByteArray(){this.page=-1;this.pages=[];this.newPage()}ByteArray.pageSize=4096;ByteArray.charMap={};for(var i=0;i<256;i++)ByteArray.charMap[i]=String.fromCharCode(i);ByteArray.prototype.newPage=function(){this.pages[++this.page]=new Uint8Array(ByteArray.pageSize);this.cursor=0};ByteArray.prototype.getData=function(){var rv="";for(var p=0;p<this.pages.length;p++){for(var i=0;i<ByteArray.pageSize;i++){rv+=ByteArray.charMap[this.pages[p][i]]}}return rv};ByteArray.prototype.writeByte=function(val){if(this.cursor>=ByteArray.pageSize)this.newPage();this.pages[this.page][this.cursor++]=val};ByteArray.prototype.writeUTFBytes=function(string){for(var l=string.length,i=0;i<l;i++)this.writeByte(string.charCodeAt(i))};ByteArray.prototype.writeBytes=function(array,offset,length){for(var l=length||array.length,i=offset||0;i<l;i++)this.writeByte(array[i])};function GIFEncoder(width,height){this.width=~~width;this.height=~~height;this.transparent=null;this.transIndex=0;this.repeat=-1;this.delay=0;this.image=null;this.pixels=null;this.indexedPixels=null;this.colorDepth=null;this.colorTab=null;this.neuQuant=null;this.usedEntry=new Array;this.palSize=7;this.dispose=-1;this.firstFrame=true;this.sample=10;this.dither=false;this.globalPalette=false;this.out=new ByteArray}GIFEncoder.prototype.setDelay=function(milliseconds){this.delay=Math.round(milliseconds/10)};GIFEncoder.prototype.setFrameRate=function(fps){this.delay=Math.round(100/fps)};GIFEncoder.prototype.setDispose=function(disposalCode){if(disposalCode>=0)this.dispose=disposalCode};GIFEncoder.prototype.setRepeat=function(repeat){this.repeat=repeat};GIFEncoder.prototype.setTransparent=function(color){this.transparent=color};GIFEncoder.prototype.addFrame=function(imageData){this.image=imageData;this.colorTab=this.globalPalette&&this.globalPalette.slice?this.globalPalette:null;this.getImagePixels();this.analyzePixels();if(this.globalPalette===true)this.globalPalette=this.colorTab;if(this.firstFrame){this.writeLSD();this.writePalette();if(this.repeat>=0){this.writeNetscapeExt()}}this.writeGraphicCtrlExt();this.writeImageDesc();if(!this.firstFrame&&!this.globalPalette)this.writePalette();this.writePixels();this.firstFrame=false};GIFEncoder.prototype.finish=function(){this.out.writeByte(59)};GIFEncoder.prototype.setQuality=function(quality){if(quality<1)quality=1;this.sample=quality};GIFEncoder.prototype.setDither=function(dither){if(dither===true)dither="FloydSteinberg";this.dither=dither};GIFEncoder.prototype.setGlobalPalette=function(palette){this.globalPalette=palette};GIFEncoder.prototype.getGlobalPalette=function(){return this.globalPalette&&this.globalPalette.slice&&this.globalPalette.slice(0)||this.globalPalette};GIFEncoder.prototype.writeHeader=function(){this.out.writeUTFBytes("GIF89a")};GIFEncoder.prototype.analyzePixels=function(){if(!this.colorTab){this.neuQuant=new NeuQuant(this.pixels,this.sample);this.neuQuant.buildColormap();this.colorTab=this.neuQuant.getColormap()}if(this.dither){this.ditherPixels(this.dither.replace("-serpentine",""),this.dither.match(/-serpentine/)!==null)}else{this.indexPixels()}this.pixels=null;this.colorDepth=8;this.palSize=7;if(this.transparent!==null){this.transIndex=this.findClosest(this.transparent,true)}};GIFEncoder.prototype.indexPixels=function(imgq){var nPix=this.pixels.length/3;this.indexedPixels=new Uint8Array(nPix);var k=0;for(var j=0;j<nPix;j++){var index=this.findClosestRGB(this.pixels[k++]&255,this.pixels[k++]&255,this.pixels[k++]&255);this.usedEntry[index]=true;this.indexedPixels[j]=index}};GIFEncoder.prototype.ditherPixels=function(kernel,serpentine){var kernels={FalseFloydSteinberg:[[3/8,1,0],[3/8,0,1],[2/8,1,1]],FloydSteinberg:[[7/16,1,0],[3/16,-1,1],[5/16,0,1],[1/16,1,1]],Stucki:[[8/42,1,0],[4/42,2,0],[2/42,-2,1],[4/42,-1,1],[8/42,0,1],[4/42,1,1],[2/42,2,1],[1/42,-2,2],[2/42,-1,2],[4/42,0,2],[2/42,1,2],[1/42,2,2]],Atkinson:[[1/8,1,0],[1/8,2,0],[1/8,-1,1],[1/8,0,1],[1/8,1,1],[1/8,0,2]]};if(!kernel||!kernels[kernel]){throw"Unknown dithering kernel: "+kernel}var ds=kernels[kernel];var index=0,height=this.height,width=this.width,data=this.pixels;var direction=serpentine?-1:1;this.indexedPixels=new Uint8Array(this.pixels.length/3);for(var y=0;y<height;y++){if(serpentine)direction=direction*-1;for(var x=direction==1?0:width-1,xend=direction==1?width:0;x!==xend;x+=direction){index=y*width+x;var idx=index*3;var r1=data[idx];var g1=data[idx+1];var b1=data[idx+2];idx=this.findClosestRGB(r1,g1,b1);this.usedEntry[idx]=true;this.indexedPixels[index]=idx;idx*=3;var r2=this.colorTab[idx];var g2=this.colorTab[idx+1];var b2=this.colorTab[idx+2];var er=r1-r2;var eg=g1-g2;var eb=b1-b2;for(var i=direction==1?0:ds.length-1,end=direction==1?ds.length:0;i!==end;i+=direction){var x1=ds[i][1];var y1=ds[i][2];if(x1+x>=0&&x1+x<width&&y1+y>=0&&y1+y<height){var d=ds[i][0];idx=index+x1+y1*width;idx*=3;data[idx]=Math.max(0,Math.min(255,data[idx]+er*d));data[idx+1]=Math.max(0,Math.min(255,data[idx+1]+eg*d));data[idx+2]=Math.max(0,Math.min(255,data[idx+2]+eb*d))}}}}};GIFEncoder.prototype.findClosest=function(c,used){return this.findClosestRGB((c&16711680)>>16,(c&65280)>>8,c&255,used)};GIFEncoder.prototype.findClosestRGB=function(r,g,b,used){if(this.colorTab===null)return-1;if(this.neuQuant&&!used){return this.neuQuant.lookupRGB(r,g,b)}var c=b|g<<8|r<<16;var minpos=0;var dmin=256*256*256;var len=this.colorTab.length;for(var i=0,index=0;i<len;index++){var dr=r-(this.colorTab[i++]&255);var dg=g-(this.colorTab[i++]&255);var db=b-(this.colorTab[i++]&255);var d=dr*dr+dg*dg+db*db;if((!used||this.usedEntry[index])&&d<dmin){dmin=d;minpos=index}}return minpos};GIFEncoder.prototype.getImagePixels=function(){var w=this.width;var h=this.height;this.pixels=new Uint8Array(w*h*3);var data=this.image;var srcPos=0;var count=0;for(var i=0;i<h;i++){for(var j=0;j<w;j++){this.pixels[count++]=data[srcPos++];this.pixels[count++]=data[srcPos++];this.pixels[count++]=data[srcPos++];srcPos++}}};GIFEncoder.prototype.writeGraphicCtrlExt=function(){this.out.writeByte(33);this.out.writeByte(249);this.out.writeByte(4);var transp,disp;if(this.transparent===null){transp=0;disp=0}else{transp=1;disp=2}if(this.dispose>=0){disp=dispose&7}disp<<=2;this.out.writeByte(0|disp|0|transp);this.writeShort(this.delay);this.out.writeByte(this.transIndex);this.out.writeByte(0)};GIFEncoder.prototype.writeImageDesc=function(){this.out.writeByte(44);this.writeShort(0);this.writeShort(0);this.writeShort(this.width);this.writeShort(this.height);if(this.firstFrame||this.globalPalette){this.out.writeByte(0)}else{this.out.writeByte(128|0|0|0|this.palSize)}};GIFEncoder.prototype.writeLSD=function(){this.writeShort(this.width);this.writeShort(this.height);this.out.writeByte(128|112|0|this.palSize);this.out.writeByte(0);this.out.writeByte(0)};GIFEncoder.prototype.writeNetscapeExt=function(){this.out.writeByte(33);this.out.writeByte(255);this.out.writeByte(11);this.out.writeUTFBytes("NETSCAPE2.0");this.out.writeByte(3);this.out.writeByte(1);this.writeShort(this.repeat);this.out.writeByte(0)};GIFEncoder.prototype.writePalette=function(){this.out.writeBytes(this.colorTab);var n=3*256-this.colorTab.length;for(var i=0;i<n;i++)this.out.writeByte(0)};GIFEncoder.prototype.writeShort=function(pValue){this.out.writeByte(pValue&255);this.out.writeByte(pValue>>8&255)};GIFEncoder.prototype.writePixels=function(){var enc=new LZWEncoder(this.width,this.height,this.indexedPixels,this.colorDepth);enc.encode(this.out)};GIFEncoder.prototype.stream=function(){return this.out};module.exports=GIFEncoder},{"./LZWEncoder.js":2,"./TypedNeuQuant.js":3}],2:[function(require,module,exports){var EOF=-1;var BITS=12;var HSIZE=5003;var masks=[0,1,3,7,15,31,63,127,255,511,1023,2047,4095,8191,16383,32767,65535];function LZWEncoder(width,height,pixels,colorDepth){var initCodeSize=Math.max(2,colorDepth);var accum=new Uint8Array(256);var htab=new Int32Array(HSIZE);var codetab=new Int32Array(HSIZE);var cur_accum,cur_bits=0;var a_count;var free_ent=0;var maxcode;var clear_flg=false;var g_init_bits,ClearCode,EOFCode;function char_out(c,outs){accum[a_count++]=c;if(a_count>=254)flush_char(outs)}function cl_block(outs){cl_hash(HSIZE);free_ent=ClearCode+2;clear_flg=true;output(ClearCode,outs)}function cl_hash(hsize){for(var i=0;i<hsize;++i)htab[i]=-1}function compress(init_bits,outs){var fcode,c,i,ent,disp,hsize_reg,hshift;g_init_bits=init_bits;clear_flg=false;n_bits=g_init_bits;maxcode=MAXCODE(n_bits);ClearCode=1<<init_bits-1;EOFCode=ClearCode+1;free_ent=ClearCode+2;a_count=0;ent=nextPixel();hshift=0;for(fcode=HSIZE;fcode<65536;fcode*=2)++hshift;hshift=8-hshift;hsize_reg=HSIZE;cl_hash(hsize_reg);output(ClearCode,outs);outer_loop:while((c=nextPixel())!=EOF){fcode=(c<<BITS)+ent;i=c<<hshift^ent;if(htab[i]===fcode){ent=codetab[i];continue}else if(htab[i]>=0){disp=hsize_reg-i;if(i===0)disp=1;do{if((i-=disp)<0)i+=hsize_reg;if(htab[i]===fcode){ent=codetab[i];continue outer_loop}}while(htab[i]>=0)}output(ent,outs);ent=c;if(free_ent<1<<BITS){codetab[i]=free_ent++;htab[i]=fcode}else{cl_block(outs)}}output(ent,outs);output(EOFCode,outs)}function encode(outs){outs.writeByte(initCodeSize);remaining=width*height;curPixel=0;compress(initCodeSize+1,outs);outs.writeByte(0)}function flush_char(outs){if(a_count>0){outs.writeByte(a_count);outs.writeBytes(accum,0,a_count);a_count=0}}function MAXCODE(n_bits){return(1<<n_bits)-1}function nextPixel(){if(remaining===0)return EOF;--remaining;var pix=pixels[curPixel++];return pix&255}function output(code,outs){cur_accum&=masks[cur_bits];if(cur_bits>0)cur_accum|=code<<cur_bits;else cur_accum=code;cur_bits+=n_bits;while(cur_bits>=8){char_out(cur_accum&255,outs);cur_accum>>=8;cur_bits-=8}if(free_ent>maxcode||clear_flg){if(clear_flg){maxcode=MAXCODE(n_bits=g_init_bits);clear_flg=false}else{++n_bits;if(n_bits==BITS)maxcode=1<<BITS;else maxcode=MAXCODE(n_bits)}}if(code==EOFCode){while(cur_bits>0){char_out(cur_accum&255,outs);cur_accum>>=8;cur_bits-=8}flush_char(outs)}}this.encode=encode}module.exports=LZWEncoder},{}],3:[function(require,module,exports){var ncycles=100;var netsize=256;var maxnetpos=netsize-1;var netbiasshift=4;var intbiasshift=16;var intbias=1<<intbiasshift;var gammashift=10;var gamma=1<<gammashift;var betashift=10;var beta=intbias>>betashift;var betagamma=intbias<<gammashift-betashift;var initrad=netsize>>3;var radiusbiasshift=6;var radiusbias=1<<radiusbiasshift;var initradius=initrad*radiusbias;var radiusdec=30;var alphabiasshift=10;var initalpha=1<<alphabiasshift;var alphadec;var radbiasshift=8;var radbias=1<<radbiasshift;var alpharadbshift=alphabiasshift+radbiasshift;var alpharadbias=1<<alpharadbshift;var prime1=499;var prime2=491;var prime3=487;var prime4=503;var minpicturebytes=3*prime4;function NeuQuant(pixels,samplefac){var network;var netindex;var bias;var freq;var radpower;function init(){network=[];netindex=new Int32Array(256);bias=new Int32Array(netsize);freq=new Int32Array(netsize);radpower=new Int32Array(netsize>>3);var i,v;for(i=0;i<netsize;i++){v=(i<<netbiasshift+8)/netsize;network[i]=new Float64Array([v,v,v,0]);freq[i]=intbias/netsize;bias[i]=0}}function unbiasnet(){for(var i=0;i<netsize;i++){network[i][0]>>=netbiasshift;network[i][1]>>=netbiasshift;network[i][2]>>=netbiasshift;network[i][3]=i}}function altersingle(alpha,i,b,g,r){network[i][0]-=alpha*(network[i][0]-b)/initalpha;network[i][1]-=alpha*(network[i][1]-g)/initalpha;network[i][2]-=alpha*(network[i][2]-r)/initalpha}function alterneigh(radius,i,b,g,r){var lo=Math.abs(i-radius);var hi=Math.min(i+radius,netsize);var j=i+1;var k=i-1;var m=1;var p,a;while(j<hi||k>lo){a=radpower[m++];if(j<hi){p=network[j++];p[0]-=a*(p[0]-b)/alpharadbias;p[1]-=a*(p[1]-g)/alpharadbias;p[2]-=a*(p[2]-r)/alpharadbias}if(k>lo){p=network[k--];p[0]-=a*(p[0]-b)/alpharadbias;p[1]-=a*(p[1]-g)/alpharadbias;p[2]-=a*(p[2]-r)/alpharadbias}}}function contest(b,g,r){var bestd=~(1<<31);var bestbiasd=bestd;var bestpos=-1;var bestbiaspos=bestpos;var i,n,dist,biasdist,betafreq;for(i=0;i<netsize;i++){n=network[i];dist=Math.abs(n[0]-b)+Math.abs(n[1]-g)+Math.abs(n[2]-r);if(dist<bestd){bestd=dist;bestpos=i}biasdist=dist-(bias[i]>>intbiasshift-netbiasshift);if(biasdist<bestbiasd){bestbiasd=biasdist;bestbiaspos=i}betafreq=freq[i]>>betashift;freq[i]-=betafreq;bias[i]+=betafreq<<gammashift}freq[bestpos]+=beta;bias[bestpos]-=betagamma;return bestbiaspos}function inxbuild(){var i,j,p,q,smallpos,smallval,previouscol=0,startpos=0;for(i=0;i<netsize;i++){p=network[i];smallpos=i;smallval=p[1];for(j=i+1;j<netsize;j++){q=network[j];if(q[1]<smallval){smallpos=j;smallval=q[1]}}q=network[smallpos];if(i!=smallpos){j=q[0];q[0]=p[0];p[0]=j;j=q[1];q[1]=p[1];p[1]=j;j=q[2];q[2]=p[2];p[2]=j;j=q[3];q[3]=p[3];p[3]=j}if(smallval!=previouscol){netindex[previouscol]=startpos+i>>1;for(j=previouscol+1;j<smallval;j++)netindex[j]=i;previouscol=smallval;startpos=i}}netindex[previouscol]=startpos+maxnetpos>>1;for(j=previouscol+1;j<256;j++)netindex[j]=maxnetpos}function inxsearch(b,g,r){var a,p,dist;var bestd=1e3;var best=-1;var i=netindex[g];var j=i-1;while(i<netsize||j>=0){if(i<netsize){p=network[i];dist=p[1]-g;if(dist>=bestd)i=netsize;else{i++;if(dist<0)dist=-dist;a=p[0]-b;if(a<0)a=-a;dist+=a;if(dist<bestd){a=p[2]-r;if(a<0)a=-a;dist+=a;if(dist<bestd){bestd=dist;best=p[3]}}}}if(j>=0){p=network[j];dist=g-p[1];if(dist>=bestd)j=-1;else{j--;if(dist<0)dist=-dist;a=p[0]-b;if(a<0)a=-a;dist+=a;if(dist<bestd){a=p[2]-r;if(a<0)a=-a;dist+=a;if(dist<bestd){bestd=dist;best=p[3]}}}}}return best}function learn(){var i;var lengthcount=pixels.length;var alphadec=30+(samplefac-1)/3;var samplepixels=lengthcount/(3*samplefac);var delta=~~(samplepixels/ncycles);var alpha=initalpha;var radius=initradius;var rad=radius>>radiusbiasshift;if(rad<=1)rad=0;for(i=0;i<rad;i++)radpower[i]=alpha*((rad*rad-i*i)*radbias/(rad*rad));var step;if(lengthcount<minpicturebytes){samplefac=1;step=3}else if(lengthcount%prime1!==0){step=3*prime1}else if(lengthcount%prime2!==0){step=3*prime2}else if(lengthcount%prime3!==0){step=3*prime3}else{step=3*prime4}var b,g,r,j;var pix=0;i=0;while(i<samplepixels){b=(pixels[pix]&255)<<netbiasshift;g=(pixels[pix+1]&255)<<netbiasshift;r=(pixels[pix+2]&255)<<netbiasshift;j=contest(b,g,r);altersingle(alpha,j,b,g,r);if(rad!==0)alterneigh(rad,j,b,g,r);pix+=step;if(pix>=lengthcount)pix-=lengthcount;i++;if(delta===0)delta=1;if(i%delta===0){alpha-=alpha/alphadec;radius-=radius/radiusdec;rad=radius>>radiusbiasshift;if(rad<=1)rad=0;for(j=0;j<rad;j++)radpower[j]=alpha*((rad*rad-j*j)*radbias/(rad*rad))}}}function buildColormap(){init();learn();unbiasnet();inxbuild()}this.buildColormap=buildColormap;function getColormap(){var map=[];var index=[];for(var i=0;i<netsize;i++)index[network[i][3]]=i;var k=0;for(var l=0;l<netsize;l++){var j=index[l];map[k++]=network[j][0];map[k++]=network[j][1];map[k++]=network[j][2]}return map}this.getColormap=getColormap;this.lookupRGB=inxsearch}module.exports=NeuQuant},{}],4:[function(require,module,exports){var GIFEncoder,renderFrame;GIFEncoder=require("./GIFEncoder.js");renderFrame=function(frame){var encoder,page,stream,transfer;encoder=new GIFEncoder(frame.width,frame.height);if(frame.index===0){encoder.writeHeader()}else{encoder.firstFrame=false}encoder.setTransparent(frame.transparent);encoder.setRepeat(frame.repeat);encoder.setDelay(frame.delay);encoder.setQuality(frame.quality);encoder.setDither(frame.dither);encoder.setGlobalPalette(frame.globalPalette);encoder.addFrame(frame.data);if(frame.last){encoder.finish()}if(frame.globalPalette===true){frame.globalPalette=encoder.getGlobalPalette()}stream=encoder.stream();frame.data=stream.pages;frame.cursor=stream.cursor;frame.pageSize=stream.constructor.pageSize;if(frame.canTransfer){transfer=function(){var i,len,ref,results;ref=frame.data;results=[];for(i=0,len=ref.length;i<len;i++){page=ref[i];results.push(page.buffer)}return results}();return self.postMessage(frame,transfer)}else{return self.postMessage(frame)}};self.onmessage=function(event){return renderFrame(event.data)}},{"./GIFEncoder.js":1}]},{},[4]);
//# sourceMappingURL=gif.worker.js.map

`;

// Create blob from worker string
const workerBlob = new Blob([workerString], { type: 'application/javascript' });

// Create URL from blob
const workerUrl = URL.createObjectURL(workerBlob);

// contentScript.js
console.log('Starting content script...');

// Inject CSS styles into the page
console.log('Creating style element...');
const style = document.createElement('style');
style.textContent = `
.lottie-popover {
    opacity: 0;
    transition: opacity 0.3s ease-in-out;
    background: transparent;
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border: none;
    padding: 8px;
    border-radius: 0;
    z-index: 99999;
    max-width: 1000px;
    width: 100%;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    justify-content: center;
}
.lottie-popover:hover {
    opacity: 1;
}

.lottie-popover button {
  background-color: #00c1a2;
  color: #fff;
  border: none;
  padding: 8px 16px;
  border-radius: 12px;
  cursor: pointer;
  margin: 4px;
  width: auto;
  min-height: 36px;
  font-size: 14px;
}

.lottie-popover button:hover {
  background-color: #00c1a2;
}
`;
document.head.appendChild(style);
console.log('Style element injected into page');

// Function to create and display the popover
function createPopover(element, index) {
  console.log(`Creating popover for element ${index}...`);
  const src = element.getAttribute('src');
  if (!src || !src.endsWith('.lottie')) {
    console.log('Invalid or non-lottie src attribute, skipping...');
    return;
  }

  // Extract the animation name from the src URL
  console.log('Extracting animation name from URL...');
  const urlParts = src.split('/');
  const fileName = urlParts[urlParts.length - 1];
  const animationName = decodeURIComponent(fileName);
  console.log(`Animation name: ${animationName}`);

  // Create the popover container with a unique ID
  console.log('Creating popover container...');
  const popover = document.createElement('div');
  popover.className = 'lottie-popover';
  popover.id = `lottie-popover-${index}`;

  // Add content to the popover
  console.log('Adding content to popover...');
  popover.innerHTML = `
    <button id="download-json-button-${index}">Download JSON</button>
    <button id="download-gif-button-${index}">Download GIF</button>
  `;

// append the popover to the element
    element.parentNode.appendChild(popover);
    element.parentNode.style.position = 'relative';
    element.setAttribute('data-popover-added', 'true');
    
    


  console.log('Popover added to document body');

  // Function to update popover position
  function updatePopoverPosition() {
    const elementRect = element.getBoundingClientRect();
    const popoverRect = popover.getBoundingClientRect();
    
    // Position at top right corner of the element
    const top = elementRect.top;
    const left = elementRect.right - popoverRect.width;

    // Ensure popover stays within viewport
    const adjustedTop = Math.max(10, Math.min(top, window.innerHeight - popoverRect.height - 10));
    const adjustedLeft = Math.max(10, Math.min(left, window.innerWidth - popoverRect.width - 10));

    // popover.style.top = `${adjustedTop}px`;
    // popover.style.left = `${adjustedLeft}px`;
  }

  // Initial position update
  updatePopoverPosition();

  // Add event listeners for scroll and resize
  const scrollableParents = getScrollableParents(element);
  let ticking = false;

  const onFrame = () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        updatePopoverPosition();
        ticking = false;
      });
      ticking = true;
    }
  };

  
  // Store event cleanup function on the element
  element.popoverCleanup = () => {
    scrollableParents.forEach(parent => {
      parent.removeEventListener('scroll', updatePopoverPosition);
    });
    window.removeEventListener('resize', updatePopoverPosition);
  };

  // Add event listeners to buttons
  console.log('Adding click event listener to download button...');
  const downloadJsonButton = document.getElementById(`download-json-button-${index}`);
  downloadJsonButton.addEventListener('click', () => {
    console.log('Download button clicked, sending message to background script...');
    chrome.runtime.sendMessage({
      action: 'processLottieFile',
      src,
      index,
      animationName
    });
  });
  const downloadGifButton = document.getElementById(`download-gif-button-${index}`);
  downloadGifButton.addEventListener('click', async () => {
    console.log('GIF download button clicked');
    // Start GIF generation
    generateLottieGif(src, index);
  });

  console.log('Popover creation complete');
}

// Helper function to get all scrollable parents of an element
function getScrollableParents(element) {
  const scrollableParents = [];
  let currentElement = element;

  while (currentElement) {
    if (currentElement.scrollHeight > currentElement.clientHeight) {
      scrollableParents.push(currentElement);
    }
    currentElement = currentElement.parentElement;
  }

  // Always include window for scroll events
  scrollableParents.push(window);
  return scrollableParents;
}

// Detect all <dotlottie-player> elements
console.log('Searching for dotlottie-player elements...');
const dotLottieElements = document.querySelectorAll('dotlottie-player');
if (dotLottieElements.length === 0) {
  console.log('No elements found initially, waiting for DOM content loaded...');
  // If no elements found initially, wait for DOM content to be loaded
  // Set up MutationObserver immediately to catch dynamically added elements
  console.log('Setting up MutationObserver...');
  const observer = new MutationObserver((mutations) => {
    mutations.forEach(mutation => {
      // Clean up removed elements
      mutation.removedNodes.forEach(node => {
        if (node.nodeType === 1 && node.matches('dotlottie-player')) {
          const index = node.getAttribute('data-popover-index');
          if (index) {
            const popover = document.getElementById(`lottie-popover-${index}`);
            if (popover) {
              popover.remove();
            }
            // Clean up event listeners
            if (node.popoverCleanup) {
              node.popoverCleanup();
            }
          }
        }
      });

      // Add popovers for new elements
      const newElements = document.querySelectorAll('dotlottie-player:not([data-popover-added])');
      newElements.forEach((element, index) => {
        console.log(`Found new element ${index}, creating popover...`);
        element.setAttribute('data-popover-index', index);
        element.setAttribute('data-popover-added', 'true');
        createPopover(element, index);
      });
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  console.log('MutationObserver started');

  // Also do an immediate check for any existing elements
  const existingElements = document.querySelectorAll('dotlottie-player');
  existingElements.forEach((element, index) => {
    if (!element.hasAttribute('data-popover-added')) {
      console.log(`Found existing element ${index}, creating popover...`);
      createPopover(element, index);
      element.setAttribute('data-popover-added', 'true');
    }
  });
}

console.log('Processing initial elements found...');
dotLottieElements.forEach((element, index) => {
  createPopover(element, index);
});

console.log('Content script initialization complete');

downloadGifButton.addEventListener('click', async () => {
  console.log('GIF download button clicked');
  // Start GIF generation
  generateLottieGif(src, index);
});

async function generateLottieGif(src, index) {
  console.log(`Starting GIF generation for source: ${src}`);
  try {
    // Fetch the .lottie file
    console.log('Fetching .lottie file...');
    const response = await fetch(src);
    if (!response.ok) throw new Error('Failed to fetch .lottie file.');
    const arrayBuffer = await response.arrayBuffer();
    console.log('.lottie file fetched successfully');

    // Load the .lottie file using JSZip
    console.log('Loading .lottie file with JSZip...');
    const zip = await JSZip.loadAsync(arrayBuffer);
    console.log('JSZip loaded successfully');

    // Extract and parse the manifest.json
    console.log('Extracting manifest.json...');
    const manifestFile = zip.file('manifest.json');
    if (!manifestFile) throw new Error('manifest.json not found in .lottie file');
    const manifestContent = await manifestFile.async('string');
    const manifest = JSON.parse(manifestContent);
    console.log('Manifest parsed successfully');

    // Get the first animation
    console.log('Getting animation data...');
    if (!manifest.animations || manifest.animations.length === 0) {
      throw new Error('No animations found in manifest');
    }
    const animationMeta = manifest.animations[0];
    const animationId = animationMeta.id;
    const animationPath = `animations/${animationId}.json`;
    const animationFile = zip.file(animationPath);
    if (!animationFile) throw new Error(`Animation file ${animationPath} not found`);
    const lottieJsonData = await animationFile.async('string');
    const lottieJson = JSON.parse(lottieJsonData);
    console.log('Animation data extracted successfully');

    // Create an off-screen canvas
    console.log('Creating canvas...');
    const canvas = document.createElement('canvas');
    const lottieRatio = lottieJson.w / lottieJson.h;
    const minWidth = 500;
    const minHeight = 500 / lottieRatio;  
    canvas.width = lottieJson.w < minWidth ? minWidth : lottieJson.w;
    canvas.height = lottieJson.h < minHeight ? minHeight : lottieJson.h;
    const ctx = canvas.getContext('2d');
    
    ctx.antialias = true;
    ctx.dpr = 2;


    // Enable high-quality rendering settings
    ctx.globalCompositeOperation = 'source-over';
    ctx.webkitImageSmoothingEnabled = true;
    ctx.mozImageSmoothingEnabled = true;
    ctx.msImageSmoothingEnabled = true;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    if (!ctx) throw new Error('Failed to get canvas context');
    console.log(`Canvas created with dimensions: ${canvas.width}x${canvas.height}`);

    // Append canvas to the body (hidden)
    canvas.style.display = 'none';
    document.body.appendChild(canvas);
    console.log('Canvas appended to document');

    // Initialize Lottie
    console.log('Initializing Lottie animation...');

    const svg = document.createElement('svg');
    svg.style.display = 'none';
    svg.style.width = canvas.width + 'px';
    svg.style.height = canvas.height + 'px';
    document.body.appendChild(svg);
    const animation = lottie.loadAnimation({
      renderer: 'canvas',
      loop: true,
      autoplay: true,
      animationData: lottieJson,
      rendererSettings: {
        context: ctx,
        clearCanvas: true,
        quality: 1, // Keep at 1 for highest quality
        hideOnTransparent: false, // Render all pixels including transparent ones
        antialias: true,
        className: 'lottie-canvas',
      }
    });
    console.log('Lottie animation initialized');

    // Wait for animation to be ready
    console.log('Waiting for animation to load...');
    await new Promise((resolve, reject) => {
      animation.addEventListener('DOMLoaded', resolve);
      animation.addEventListener('error', reject);
    });
    console.log('Animation loaded');

    // Initialize GIF.js
    console.log('Initializing GIF encoder...');
    const gif = new GIF({
      workers: 2, // More workers for better performance with larger frames
      width: canvas.width  , // Double width for higher DPR
      height: canvas.height , // Double height for higher DPR
      workerScript: workerUrl,
      
      transparent: true,
      background: null,
      repeat: 1,
      quality: 30, // Highest quality (1-30, lower is better)
    
    });
    console.log('GIF encoder initialized');

    const totalFrames = animation.totalFrames;
    const frameRate = animation.frameRate;
    if (!totalFrames || !frameRate) throw new Error('Invalid animation parameters');
    const delay = 1000 / frameRate;
    console.log(`Processing ${totalFrames} frames at ${frameRate} fps...`);

    // Render and add frames to GIF
    for (let i = 0; i < totalFrames; i++) {
      console.log(`Processing frame ${i + 1}/${totalFrames}`);
      animation.goToAndStop(i, true);
      gif.addFrame(ctx, { copy: true, delay });
    }

    // Render and download the GIF
    console.log('Rendering final GIF...');
    await new Promise((resolve, reject) => {
      gif.on('finished', function(blob) {
        try {
          console.log('GIF finished rendering');
          // Create download link
          console.log('Creating object URL from blob...');
          const url = URL.createObjectURL(blob);
          console.log('Object URL created:', url);

          console.log('Creating download link element...');
          const a = document.createElement('a');
          a.href = url;
          a.download = `animation_${index}.gif`;
          console.log('Download link configured');
          
          // Trigger download
          console.log('Triggering download...');
          document.body.appendChild(a);
          a.click();
          console.log('Download triggered');
          
          // Cleanup
          console.log('Starting cleanup...');
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          document.body.removeChild(canvas);
          animation.destroy();
          console.log('Cleanup complete');
          console.log('GIF download complete');
          resolve();
        } catch (error) {
          reject(error);
        }
      });

      gif.on('error', reject);

      console.log('Starting GIF rendering...');
      gif.render();
    });
  } catch (error) {
    console.error('Error generating GIF:', error);
    throw error; // Re-throw to allow handling by caller
  }
}