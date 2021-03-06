import { Component, OnInit } from "@angular/core";
import { Router, ROUTER_DIRECTIVES, ActivatedRoute } from "@angular/router";

import { LocalStorageService } from "../../services/localStorage.service";

@Component({
	selector: "searchbar",
	templateUrl: "app/component/navigation/searchbar.component.html",

})

export class SearchbarComponent {

	private _searchvalue: string;

    public set searchvalue(value: string) {
        this._searchvalue = value;
        this._storage.set("searchvalue", value);
    }

    public get searchvalue(): string {
        return this._searchvalue;
    }

    constructor(private _route: ActivatedRoute, private _router: Router, private _storage: LocalStorageService) {

		this._route.params.subscribe(params => {
            if (params["value"] != null) {
                this.searchvalue = decodeURIComponent(params["value"]);
            }
		});

        // if (_storage.get("searchvalue")) {
        //     this.searchvalue = _storage.get("searchvalue");
        // }
    }

    search(event: Event) {
        event.preventDefault();
        
        document.getElementById("fixed-header-drawer-exp").blur();
        jQuery("#seachSubmit").focus();

        this._router.navigate(["/search", this.searchvalue, 0])

    }

}
