import { Component, NgZone } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import {BLE} from 'ionic-native';

/*
  Generated class for the Robo page.

  See http://ionicframework.com/docs/v2/components/#navigation for more info on
  Ionic pages and navigation.
*/
@Component({
  selector: 'page-robo',
  templateUrl: 'robo.html'
})

export class RoboPage {

  transferCha = "fff6";
  cli;
  receiveList = [];
  sendList = [];

  constructor(public navCtrl: NavController, public navParams: NavParams, private zone: NgZone) {
    this.cli = navParams.get('cli');
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad RoboPage');
  }

  sendHEX(){
    alert(this.cli);
    BLE.write(this.navParams.data[1], this.navParams.data[0], this.transferCha, this.stringToBytes(this.hexCharCodeToStr(this.cli))).then(
      ()=>{
        this.zone.run(() => { //running inside the zone because otherwise the view is not updated
          this.sendList.push("<p>"+this.strToHexCharCode(this.cli)+"</p>")
      });
      },
      ()=>{
        alert("write trans error");
        console.log("Error");
      }
    );
  }
  startNotifyTrans() {
    BLE.startNotification(this.navParams.data[1], this.navParams.data[0], this.transferCha).subscribe(
      data=>{
        alert(data);
        alert(this.strToHexCharCode(data));
        this.zone.run(() => { //running inside the zone because otherwise the view is not updated
          this.receiveList.push("<p>"+this.strToHexCharCode(data)+"</p>")
      });
      },
      ()=>{
        alert("start notify trans error");
        console.log("Error");
      }
    );
  }
  stopNotifyTrans() {
    BLE.stopNotification(this.navParams.data[1], this.navParams.data[0], this.transferCha);
  }
  // ASCII only
bytesToString(buffer) {
    return String.fromCharCode.apply(null, new Uint8Array(buffer));
}
//copy from javascript
// ASCII only
stringToBytes(string) {
    var array = new Uint8Array(string.length);
    for (var i = 0, l = string.length; i < l; i++) {
        array[i] = string.charCodeAt(i);
    }
    return array.buffer;
}
strToHexCharCode(str) {
    if(str === "")
     return "";
    var hexCharCode = [];
    hexCharCode.push("0x");    
    for(var i = 0; i < str.length; i++) {
     hexCharCode.push((str.charCodeAt(i)).toString(16));
    }
    return hexCharCode.join("");
   }
hexCharCodeToStr(hexCharCodeStr) {
    var trimedStr = hexCharCodeStr.trim();
    var rawStr = 
      trimedStr.substr(0,2).toLowerCase() === "0x"
      ? 
      trimedStr.substr(2) 
      : 
      trimedStr;
    var len = rawStr.length;
    if(len % 2 !== 0) {
     alert("Illegal Format ASCII Code!");
        return "";
    }
    var curCharCode;
    var resultStr = [];
    for(var i = 0; i < len;i = i + 2) {
     curCharCode = parseInt(rawStr.substr(i, 2), 16); // ASCII Code Value
     resultStr.push(String.fromCharCode(curCharCode));
    }
    return resultStr.join("");
   }

}
