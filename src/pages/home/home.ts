/*
To Do:

 Check if bluetooth is enabled.
 scan button if required
 Handle connection errors


*/


import { Component, NgZone } from '@angular/core';
import { NavController,AlertController } from 'ionic-angular';
import {BLE} from 'ionic-native';
import { HornbillServicesPage } from '../hornbill-services/hornbill-services';
import { TransferPage } from '../transfer/transfer';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  //devices:{name:string,deviceID:string,rssi:string}[];
  devices = [];

  constructor(public navCtrl: NavController, public alertCtrl: AlertController,private zone: NgZone) {
  this.devices = [];

  this.checkBluetooth();

  }

  //check if bluetooth is enabled on the device.
  checkBluetooth(){
    BLE.isEnabled().then(
      ()=>{
          console.log("Bluetooth is enabled on device");
          this.startScanning(undefined);
      },
      ()=>{
          console.log("show message to user");
          this.showConfirm();
      }
    );
  }

  showConfirm() {
      let confirm = this.alertCtrl.create({
      title: 'Turn ON Bluetooth',
      message: 'Looks like phone bluetooth is disabled, enable it and retry!',
      buttons: [
      {
        text: 'Okay',
        handler: () => {
          console.log('Okay');
        }
      }]
      });
      confirm.present();
  }

  startScanning(refresher){
    this.devices = [];
    console.log("Scanning Started");
    BLE.scan([],2).subscribe(device => {
        //this.devices.push = device;
        console.log(JSON.stringify(device));
        console.log(device.name);
        this.zone.run(() => { //running inside the zone because otherwise the view is not updated
        this.devices.push(device)
      });
        //this.stopScanning();
    });
    if(refresher != undefined)
          refresher.complete();
  }


  selectDevice(deviceID:String){

      console.log("device Selected" + deviceID);
      this.navCtrl.push(HornbillServicesPage, deviceID);

  }

  selectDeviceTransfer(deviceID:String){
      //alert("connect to device"+deviceID);
      console.log("device Selected for transfer data" + deviceID);
      this.navCtrl.push(TransferPage, deviceID);

  }

  /*
  stopScanning(){
    setTimeout(() => {
       BLE.stopScan().then(() => { console.log('scan stopped'); });
    }, 5000);
  }
  */


}
