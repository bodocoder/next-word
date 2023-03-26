document.querySelector("#nextPage").addEventListener("change", function(event) {
    console.log(event);
})

function encodeImageFileAsURL(element) {
    var file = element.files[0];
    var reader = new FileReader();
    reader.onloadend = function() {
        const base64img = reader.result;
        document.querySelector("#base64page").value = base64img;
    }
    reader.readAsDataURL(file);
  }
