import { Component, OnInit } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import {BLE} from 'ionic-native';
import { RoboPage } from '../robo/robo';
import {LightsPage} from '../lights/lights';
import {BatteryPage} from '../battery/battery';
import {TransferPage} from '../transfer/transfer';



/*
  Generated class for the HornbillServices page.

  See http://ionicframework.com/docs/v2/components/#navigation for more info on
  Ionic pages and navigation.
*/
@Component({
  selector: 'page-hornbill-services',
  templateUrl: 'hornbill-services.html'
})
export class HornbillServicesPage implements OnInit {

  deviceId:string="";
  deviceServices = [];
  robo_Service_UUID = "1800";
  rgb_lights_Service_UUID = "1801";
  trans_Service_UUID = "fff0";
  battery_Service_UUID = "180f"

  constructor(public navCtrl: NavController, public navParams: NavParams) {}

  ngOnInit() {
    console.log('ionViewDidLoad HornbillServicesPage');
    console.log(this.navParams.data);
    this.deviceId = this.navParams.data;
    this.discoverServices();
  }

  discoverServices(){
    console.log("trying to connect");
    BLE.connect(this.deviceId).subscribe(peripheralData => {
        console.log(peripheralData);
        this.deviceServices = peripheralData.services;
        console.log(this.deviceServices);
      },
      peripheralData => {
        console.log('disconnected');
      });
  }

  selectService(serviceId:String){
    //To Do:
    //Check the service id and call relevant functionality.

    console.log(serviceId);
    alert("service ID: "+serviceId);
    if(serviceId == this.robo_Service_UUID){
      this.navCtrl.push(RoboPage, [serviceId, this.deviceId]);
    }
    else if(serviceId == this.rgb_lights_Service_UUID){
      this.navCtrl.push(LightsPage, [serviceId, this.deviceId]);
    }
    else if(serviceId == this.battery_Service_UUID){
      this.navCtrl.push(BatteryPage, [serviceId, this.deviceId]);
    }
    else if(serviceId == this.trans_Service_UUID){
      this.navCtrl.push(TransferPage, [serviceId, this.deviceId]);
    }
    else{
      alert("unknown service ID: "+serviceId+this.deviceId);
      console.log("unknown service");
      this.navCtrl.push(LightsPage, [serviceId, this.deviceId]);
    }

  }


}
