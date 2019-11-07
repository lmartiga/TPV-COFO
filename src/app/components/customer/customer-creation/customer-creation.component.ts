import {
  Component,
  OnInit,
  HostBinding,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef,
  AfterViewInit
} from '@angular/core';
import 'rxjs/add/operator/startWith';
import 'rxjs/add/operator/map';

import { CustomerService } from 'app/services/customer/customer.service';
import { AddressType } from 'app/shared/address/address-type.enum';
import { StatusBarService } from 'app/services/status-bar/status-bar.service';
import { Customer } from 'app/shared/customer/customer';
import { Country } from 'app/shared/address/country';
import { City } from 'app/shared/address/city';
import { Province } from 'app/shared/address/province';
import { Address } from 'app/shared/address/address';
import { TinType } from 'app/shared/customer/tin-type';
import { AppDataConfiguration } from 'app/config/app-data.config';
import { CustomerSelectedResult } from 'app/shared/customer/customer-selected-result';
import { NgForm } from '@angular/forms';
import { GenericHelper } from 'app/helpers/generic-helper';
import { LanguageService } from 'app/services/language/language.service';
import { LogHelper } from 'app/helpers/log-helper';

@Component({
  selector: 'tpv-customer-creation',
  templateUrl: './customer-creation.component.html',
  styleUrls: ['./customer-creation.component.scss']
})
export class CustomerCreationComponent implements OnInit, AfterViewInit {
  @HostBinding('class') class = 'tpv-customer-creation';
  // para pasar el customer al componente padre
  @Output() customerSelected = new EventEmitter<CustomerSelectedResult>();

  // para poner el foco en el primer input
  @ViewChild('tinInput') tin: ElementRef;
  @ViewChild('createCustomerForm') createCustomerForm: NgForm;

  // cliente a crear
  customer: Customer;
  // paises posibles
  countryList: Array<Country>;
  // provincias posibles
  provinceList: Array<Province>;
  // filtro del autocompletado para ciudades
  filteredCities: City[];
  // filtro del autoocompletado para paises
  filteredCountries: Country[];
  // filtro del autocompletado para provincias
  filteredProvinces: Province[];
  // pais por defecto
  defaultCountryId: number;
  // tipos de tin
  tinTypeList: Array<TinType> = [];
  // saber si se ha de mostrar el select de tipo TIN
  showTypeTinList = false;
  // clase del input del tin (anchura dependiendo de si se ve el input de tipo de TIN)
  tininputclass = '';
  // matricula. solo si el parametro CUSTOMER_PLATE_MUST_BE_REQUESTED lo exige
  txtPlate: string;
  mustRequestCustomerPlate: boolean;
  // mensajes de error del formulario
  public messageErrorList = {
    tin: this.getLiteral('customer_creation_component','error_CreateCustomer_TINRequired'),
    businessName: this.getLiteral('customer_creation_component','error_CreateCustomer_BusinessNameRequired'), 
    country: this.getLiteral('customer_creation_component','error_CreateCustomer_CountryRequired'),
    city: this.getLiteral('customer_creation_component','error_CreateCustomer_CitiesCouldNotBeGet'),
    postalCode: this.getLiteral('customer_creation_component','error_CreateCustomer_PostalCodeRequired'),
    province: this.getLiteral('customer_creation_component','error_CreateCustomer_ProvinceRequired'),
    street: this.getLiteral('customer_creation_component','error_CreateCustomer_AddressRequired')
  };

  private _requestingCreateCustomer: boolean = false;

  constructor(
    private _customerService: CustomerService,
    private _statusBarService: StatusBarService,
    private _appDataConfig: AppDataConfiguration,
    private _languageService: LanguageService,
    private  _logHelper: LogHelper
  ) {
    this.customer = this._customerEmpty();
    this.mustRequestCustomerPlate = this._appDataConfig.mustRequestCustomerPlate;
  }

  ngOnInit() {
    this._getCountries();
    this._getTinTypeList();
  }

  ngAfterViewInit(): void {
    // NOTA: hack timeout para ejecutar funciones estando ya renderizado el HTML
    setTimeout(() => {
      // NOTA: de momento el foco de este componente es controlado por su padre CUSTOMER
      // this.setInputFocus();
    }, 0);
  }

  setInputFocus() {
    if (this.tin) {
      (this.tin.nativeElement as HTMLElement).click();
      (this.tin.nativeElement as HTMLElement).focus();
    }
  }

  // CAMBIOS EN FORM
  //////////////////
  get customerAddress(): Address {
    return this.customer.addressList[0];
  }

  // cuando cambia país se buscan sus ciudades y provincias
  onCountryChange() {
    const country: Country = this._getCountryByName(this.customerAddress.country.name);
    if (country != undefined) {
      this.customerAddress.country = GenericHelper.deepCopy(country);
    } else {
      this.customerAddress.country.id = undefined;
    }
    this._resetAddressByCountry();
    this._getCities(this.customerAddress.country.name);
    this._getProvinces(this.customerAddress.country.name);
  }

  onInputCountryChange() {
    const data = this.customerAddress.country.name;
    if (data == '' || data == undefined || data.length < 2) {
      this.filteredCountries = [];
    } else {
      this._getCountriesByName(data);
    }
  }

  onCountrySelected() {
    const countryName = this.customerAddress.country.name;
    this.customerAddress.country = GenericHelper.deepCopy(this._getCountryByName(countryName));
  }

  // detecta cualquier introducción en input de ciudad
  // muestra ciudades o no según los valores introducidos
  // llama a la función que comprueba datos de la ciudad introducida
  onInputCityChange() {
    const data = this.customerAddress.city.name;
    if (data == '' || data == undefined || data.length < 3) {
      this.filteredCities = [];
    } else {
      this._getCitiesByName(data);
    }
  }

  onCitySelected() {
    const cityName = this.customerAddress.city.name;
    const city: City = this._getCityByName(cityName);
    if (city != undefined) {
      this.customerAddress.city = GenericHelper.deepCopy(city);
    } else {
      this.customerAddress.city = this._cityEmpty();
      this.customerAddress.city.name = cityName;
    }
  }

  // detecta cuando la ciudad es cambiada y puede contener su CP/Provincia
  onCityChange() {
    const cityName = this.customerAddress.city.name;
    const city: City = this._getCityByName(cityName);
    if (city != undefined) {
      this.customerAddress.city = GenericHelper.deepCopy(city);
    } else {
      this.customerAddress.city = this._cityEmpty();
      this.customerAddress.city.name = cityName;
    }
  }

  // si la provincia cambia la introducimos al usuario
  onProvinceChange() {
    const province: Province = this._getProvinceByName(this.customerAddress.city.provinceName);
    if (province != undefined) {
      this.customerAddress.city.provinceId = province.id;
      this.customerAddress.city.provinceName = province.name;
    } else {
      this.customerAddress.city.provinceId = undefined;
      this.customerAddress.city.provinceName = this.customerAddress.city.provinceName;
    }
  }

  // detecta cualquier introducción en input de provincia
  onInputProvinceChange() {
    const data = this.customerAddress.city.provinceName;
    if (data == '' || data == undefined || data.length < 3) {
      this.filteredProvinces = [];
    } else {
      this._getProvincesByName(data);
    }
  }

  onProvinceSelected() {
    const provinceName = this.customerAddress.city.provinceName;
    const province: Province = this._getProvinceByName(provinceName);
    if (province != undefined) {
      this.customerAddress.city.provinceId = province.id;
      this.customerAddress.city.provinceName = province.name;
    } else {
      this.customerAddress.city.provinceId = undefined;
      this.customerAddress.city.provinceName = provinceName;
    }
  }

  btnCreateClick() {
    this.createCustomerForm.ngSubmit.emit();
  }

  isRequestingCreateCustomer(): boolean {
    return this._requestingCreateCustomer;
  }

  isCountryValid(): boolean {
    if (this.customerAddress != undefined && this.customerAddress.country != undefined && this.customerAddress.country.id != undefined) {
      return true;
    }
    return false;
  }
  // OBTENER DATOS DE LISTAS
  //////////////////////////

  // obtiene un país de entre la lista de países por el nombre
  private _getCountryByName(name: string): Country {
    return this.countryList.find(it => it.name.toLowerCase() === name.toLowerCase());
  }

  private _getCountriesByName(name: string) {
    this.filteredCountries = [];
    for (let i = 0; i < this.countryList.length; i++) {
      if (this.countryList[i].name.toLowerCase().includes(name.toLowerCase())) {
        this.filteredCountries.push(this.countryList[i]);
      }
    }
  }

  // obtiene un país de entre la lista de países por el código
  private _getCountryByCode(code: number): Country {
    return this.countryList.find(it => it.id === code);
  }

  // obtiene una ciudad de entre la lista de ciudades filtradas
  private _getCityByName(name: string): City {
    return this.filteredCities.find(it => it.name.toLowerCase() === name.toLowerCase());
  }

  private _getProvinceByName(name: string): Province {
    return this.provinceList.find(it => it.name.toLowerCase() === name.toLowerCase());
  }

  private _getProvincesByName(name: string) {
    this.filteredProvinces = [];
    for (let i = 0; i < this.provinceList.length; i++) {
      if (this.provinceList[i].name.toLowerCase().includes(name.toLowerCase())) {
        this.filteredProvinces.push(this.provinceList[i]);
      }
    }
  }

  // LLAMADAS AL SERVICIO (SET)
  /////////////////////////////

  // llamar al servicio para crear cliente y ¿lo auto inserta en el ticket?
  createCustomer(isFormValid: boolean) {
    if (this._requestingCreateCustomer === true) {
      return;
    }
    if (isFormValid && this.isCountryValid()) {
      this._requestingCreateCustomer = true;
      this._logHelper.trace('Mira:');
      this._logHelper.trace(this.customer);
      // si tin cadena vacía, se manda como nulo
      if (this.customer.tinTypeId == '') {
        this.customer.tinTypeId = undefined;
      }
      if (this.customerAddress) {
        this.customerAddress.type = AddressType.customerMain;
      }
      this._customerService.createCustomer(this.customer)
        .first()
        .subscribe(
          (response) => {
            this._requestingCreateCustomer = false;
            this._logHelper.trace('CREATE CUSTOMER:'); this._logHelper.trace(response);
            if (!response.customerId) {
              this._statusBarService.publishMessage(this.getLiteral('customer_creation_component','error_CreateCustomer_CustomerCouldNotBeCreated'));
            } else {
              this.customer.id = response.customerId;
              this.customerSelected.emit({
                customer: this.customer,
                plate: this.txtPlate,
                isFromCreateForm: true
              });
              this._statusBarService.publishMessage(this.getLiteral('customer_creation_component','message_CreateCustomer_CustomerOk'));
            }
          },
          (error) => {
            this._requestingCreateCustomer = false;
            this._statusBarService.publishMessage(this.getLiteral('customer_creation_component','error_CreateCustomer_CustomerCouldNotBeCreated'));
          });
    }
  }

  // LLAMADAS AL SERVICIO (GETTERS)
  /////////////////////////////////

  // obtener paises entre las que el usuario puede elegir
  private _getCountries() {
    this._customerService.getCountries()
      .first()
      .subscribe(
        (response) => {
          this._logHelper.trace('GET COUNTRIES:'); this._logHelper.trace(response);
          if (response.countryList == undefined) {
            this._statusBarService.publishMessage(this.getLiteral('customer_creation_component','error_CreateCustomer_CountriesCouldNotBeGet'));
          } else {
            this.countryList = response.countryList;
            // si hay país por defecto
            this.defaultCountryId = this._appDataConfig.defaultCountryId;
            this._logHelper.trace('this.defaultCountryId: ' + this.defaultCountryId);
            if (this.defaultCountryId) {
              for (let i = 0; i < this.countryList.length; i++) {
                if (this.defaultCountryId == this.countryList[i].id) {
                  Object.assign(this.customerAddress.country, this._getCountryByCode(this.defaultCountryId));
                  // this._getCities(this.customerAddress.country.name);
                  this._getProvinces(this.customerAddress.country.name);
                  break;
                }
              }
            }
          }
        },
        (error) => {
          this._statusBarService.publishMessage(this.getLiteral('customer_creation_component','error_CreateCustomer_ErrorFoundOnSearch'));
        });
  }

  // obtener ciudades a partir de país elegido
  private _getCities(countryName: string) {
    // buscamos ciudades
    this._customerService.searchCityByCountry(countryName)
      .first()
      .subscribe(
        (response) => {
          this._logHelper.trace('GET CITIES BY COUNTRY: ' + countryName); this._logHelper.trace(response);
          if (response.cityList == undefined) {
            this._statusBarService.publishMessage(this.getLiteral('customer_creation_component','error_CreateCustomer_CitiesCouldNotBeGet'));
          } else {
            this.filteredCities = response.cityList;
          }
        },
        (error) => {
          this._statusBarService.publishMessage(this.getLiteral('customer_creation_component','error_CreateCustomer_ErrorFoundOnSearch'));
        });
  }

  private _getCitiesByName(cityName: string) {
    // buscamos ciudades
    this._customerService.searchCityByName(cityName)
      .first()
      .subscribe(
        (response) => {
          this._logHelper.trace('GET CITIES BY NAME: ' + cityName); this._logHelper.trace(response);
          if (response.cityList == undefined) {
            this._statusBarService.publishMessage(this.getLiteral('customer_creation_component','error_CreateCustomer_CitiesCouldNotBeGet'));
          } else {
            this.filteredCities = response.cityList;
          }
        },
        (error) => {
          this._statusBarService.publishMessage(this.getLiteral('customer_creation_component','error_CreateCustomer_ErrorFoundOnSearch'));
        });
  }

  // obtener provincias a partir de país elegida
  private _getProvinces(countryName: string) {
    this._customerService.searchProvinceByCountry(countryName)
      .first()
      .subscribe(
        (response) => {
          this._logHelper.trace('GET PROVINCES BY COUNTRY: ' + countryName); this._logHelper.trace(response);
          if (response.provinceList == undefined) {
            this._statusBarService.publishMessage(this.getLiteral('customer_creation_component','error_CreateCustomer_ProvincesCouldNotBeGet'));
          } else {
            this.provinceList = response.provinceList;
          }
        },
        (error) => {
          this._statusBarService.publishMessage(this.getLiteral('customer_creation_component','error_CreateCustomer_ErrorFoundOnSearch'));
        });
  }

  // obtener lista de tipos de tin (dni, nif...)
  private _getTinTypeList() {
    this._customerService.getTinTypeList()
      .first()
      .subscribe(
        (response) => {
          this._logHelper.trace('GET TIN TYPE LIST: '); this._logHelper.trace(response);
          if (!response.legalFormList == undefined) {
            this._statusBarService.publishMessage(this.getLiteral('customer_creation_component','error_CreateCustomer_IdentityTypesCouldNotBeGet'));
          } else {
            this.tinTypeList = response.legalFormList;
            if (this.tinTypeList.length >= 1) {
              this.showTypeTinList = true;
              this.tininputclass = 'col-xs-6';
            } else {
              this.showTypeTinList = false;
              this.tininputclass = 'col-xs-12';
            }
          }
        },
        (error) => {
          this._statusBarService.publishMessage(this.getLiteral('customer_creation_component','error_CreateCustomer_IdentityCouldNotBeGet'));
        });
  }

  // RESETS/SETTERS DE DATOS
  //////////////////////////

  // resetea información del customer dependiente del Pais
  private _resetAddressByCountry() {
    this.customerAddress.city = this._cityEmpty();
    this.provinceList = this.filteredCities = this.filteredProvinces = [];
  }

  // envia objeto customer vacío
  private _customerEmpty(): Customer {
    const cust: Customer = {
      id: '',
      tin: '',
      businessName: '',
      tinTypeId: '',
      addressList: [this._addressEmpty()],
      riesgo1: 0,
      riesgo2: 0
    };
    return cust;
  }

  // envia objeto address vacío
  private _addressEmpty(): Address {
    let address: Address;
    address = {
      city: this._cityEmpty(),
      country: { id: undefined, name: '' },
      street: ''
    };

    return address;
  }

  private _cityEmpty(): City {
    let city: City;
    city = { id: undefined, name: '', postalCode: '', provinceId: undefined, provinceName: '' };
    return city;
  }
  getLiteral(group: string, key: string): string {
    return this._languageService.getLiteral(group, key);
  }
}