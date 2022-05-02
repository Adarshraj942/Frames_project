// const form=document.getElementById("form")
// form.addEventListener('submit',(e)=>{
    
//     e.preventDefault()
// })

var options={
    width:280,
    height:240, 
    zoomWidth:500,
    offset:{vertical:0,horizontal :10},
    scale:1.5
}

new ImageZoom(document.getElementById("product-Images"),options); 
new ImageZoom(document.getElementById("product-Images1"),options); 

