/*
To Do:

 Check if bluetooth is enabled.
 scan button if required
 Handle connection errors


*/


import { Component, NgZone } from '@angular/core';
import { NavController,AlertController,Platform } from 'ionic-angular';
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

  constructor(public navCtrl: NavController, public alertCtrl: AlertController,public plt: Platform, private zone: NgZone) {
  this.devices = [];

  this.plt.ready().then(
  () =>{
    this.checkBluetooth();
      });

  }

  //check if bluetooth is enabled on the device.
  checkBluetooth(){
    
    //if (this.plt.is('android')) {
    BLE.isEnabled().then(
      ()=>{
          console.log("Bluetooth is enabled on device");
          this.startScanning(undefined);
      },
      (reason)=>{
          console.log("Blue not enabled "+reason);
          console.log("show message to user");
          this.showConfirm();
      }
    );
  //} else {
  //  this.startScanning(undefined);
  //}
  }

  showConfirm() {
      let confirm = this.alertCtrl.create({
      title: 'Turn ON Bluetooth',
      message: 'Looks like phone bluetooth is disabled, Press Okay to enable it!',
      buttons: [
      {
        text: 'Okay',
        handler: () => {
          BLE.enable().then(
            (value) => {
              this.startScanning(undefined);
            },
            (reason) => {
              alert("Failed to enable bluetooth "+reason);
            }
          );
          console.log('Okay');
        }
      },
      {
        text: 'Cancel',
        handler: () => {
          this.plt.exitApp();
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
    },
    (error)=>{
      //if (error != 'plugin_not_installed') {
        alert("BLE Scan failed "+error)
      //}
      
    }
    );
    if(refresher != undefined)
          refresher.complete();
  }


  selectDevice(deviceID:String){

      console.log("device Selected" + deviceID);
      this.navCtrl.push(HornbillServicesPage, deviceID);

  }

  selectDeviceTransfer(device){
      //alert("connect to device"+deviceID);
      console.log("device Selected for transfer data" + device);
      this.navCtrl.push(TransferPage, device);

  }

  /*
  stopScanning(){
    setTimeout(() => {
       BLE.stopScan().then(() => { console.log('scan stopped'); });
    }, 5000);
  }
  */


}
