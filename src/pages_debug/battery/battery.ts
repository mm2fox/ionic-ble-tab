import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import {BLE} from 'ionic-native';

/*
  Generated class for the Robo page.

  See http://ionicframework.com/docs/v2/components/#navigation for more info on
  Ionic pages and navigation.
*/
@Component({
  selector: 'page-battery',
  templateUrl: 'battery.html'
})

export class BatteryPage {

  batteryLevelUUID = "2a19";
  batterylevel;

  constructor(public navCtrl: NavController, public navParams: NavParams) {}

  ionViewDidLoad() {
    console.log('ionViewDidLoad BatteryPage');
  }
  readBattery() {
    console.log('readBattery');
    BLE.read(this.navParams.data[1], this.navParams.data[0], this.batteryLevelUUID).then(
      battery=>{
        alert("read battery"+battery);
        console.log("read battery successfuly"+battery);
        this.batterylevel = new Uint8Array(battery);
        this.batterylevel = this.batterylevel[0];
      },
      ()=>{
        alert("read battery error");
        console.log("Error");
          
      }
    );
    
  }
  startNotifyBattery() {
    BLE.startNotification(this.navParams.data[1], this.navParams.data[0], this.batteryLevelUUID);
  }
  stopNotifyBattery() {
    BLE.stopNotification(this.navParams.data[1], this.navParams.data[0], this.batteryLevelUUID);
  }


}
