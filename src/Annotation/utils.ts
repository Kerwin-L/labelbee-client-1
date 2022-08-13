export function getBase64(imgUrl: string, onload: (base64: any) => void) {
  window.URL = window.URL || window.webkitURL;
  var xhr = new XMLHttpRequest();
  xhr.open('get', imgUrl, true);
  // 至关重要
  xhr.responseType = 'blob';
  xhr.onload = function () {
    if (this.status == 200) {
      //得到一个blob对象
      var blob = this.response;
      console.log('blob', blob);
      // 至关重要
      let oFileReader = new FileReader();
      oFileReader.onloadend = function (e) {
        // @ts-ignore
        let img_base64 = e.target.result;
        // @ts-ignore
        const newData = img_base64.slice(22);

        onload(newData);
      };
      oFileReader.readAsDataURL(blob);
      //====为了在页面显示图片，可以删除====
      var img = document.createElement('img');
      img.onload = function (e) {
        window.URL.revokeObjectURL(img.src); // 清除释放
      };
      let src = window.URL.createObjectURL(blob);
      img.src = src;
    }
  };
  xhr.send();
}
// img2base64 by canvas
function toDataURL(src: string, outputFormat = 'image/jpeg') {
  let image = new Image();
  image.crossOrigin = 'Anonymous';
  return new Promise((resolve) => {
    image.onload = function () {
      let canvas = document.createElement('canvas');
      let ctx = canvas.getContext('2d');
      let dataURL;
      canvas.height = image.width;
      canvas.width = image.height;
      if (ctx) {
        ctx.drawImage(image, 0, 0);
      }
      dataURL = canvas.toDataURL(outputFormat);
      resolve(dataURL);
    };

    image.src = src;
    if (image.complete || image.complete === undefined) {
      image.src = 'data:image/gif;base64, R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';
      image.src = src;
    }
  });
}