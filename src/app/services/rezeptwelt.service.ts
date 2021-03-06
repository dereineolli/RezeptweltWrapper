
import {Injectable} from "@angular/core";
import {Http, URLSearchParams, Response, Headers, RequestOptions, JSONP_PROVIDERS, Jsonp } from "@angular/http";
import "rxjs/add/operator/map";

import * as jQuery from "jquery";

import { Parser } from "../utils/parser.helper";

import { SearchModel } from "../component/search/search.model";
import { SearchItemModel } from "../component/search/searchitem.model";

import { DetailModel, Ingredient, PreparationStep } from "../component/detail/detail.model";

@Injectable()
export class RezeptweltService {

    constructor(private _http: Http, private _jsonp: Jsonp) {

    }

    public getList(query: string, pageIndex = 0) {

        let nextPage = pageIndex + 1;

        query = query.replace(" ", "+");

        // let rezeptUrl = "http://www.rezeptwelt.de/search/tmrc_solr_recipe/" + query.trim() + "?filters=type%3Arecipes&page=" + nextPage;
        // use thermomix.de Page for faster Search and YQL support
        let rezeptUrl = "https://de.facebook.community.thermomix.com/search/" + query.trim() + "/score/12/" + nextPage;

        return this.post(rezeptUrl).map(res => this.extractListModel(res, nextPage));
    }

    public getRecipe(category: string, name: string, id: string) {

        let url = "http://www.rezeptwelt.de/" + category + "/" + name;

        if (id !== undefined && id.length > 0) {
            url = url + "/" + id
        }

        return this.get(url).map(response => this.extractDetailModel(response, url));
    }

    public getRecipeOfToday() {
        let url = "https://de.facebook.community.thermomix.com/";
        let xpath = "//*[@id='content']/section[contains(@class, 'recipeofday')]";
        return this.get(url, xpath).map((response) => this.extractRecipeOfToday(response));
    }


    private get(url: string, xpath = "", wrapper = true) {

        let finalUrl = url;
        let headers = new Headers({ 'Content-Type': 'application/json' });
        let options = new RequestOptions({ method: "Get", headers: headers });

        if (wrapper) {

            let query = "select * from html where url=\"" + url + "\"";

            if (xpath.length > 0) {
                query += " and xpath = \"" + xpath + "\"";
            }

            finalUrl = "https://query.yahooapis.com/v1/public/yql?q=" + encodeURIComponent(query) + "&format=xml&callback=JSONP_CALLBACK";

        }
        return this._jsonp.get(finalUrl, options);
    }

    private post(url: string, wrapper = true) {

        let finalUrl = url;
        let options = new RequestOptions({ method: "Get" });

        if (wrapper) {
            finalUrl = "https://query.yahooapis.com/v1/public/yql?q=" + encodeURIComponent("select * from jsonpost where url=\"" + url + "\" and postdata=\"\" ") + "&format=json&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys&callback=JSONP_CALLBACK";
        }

        return this._jsonp.get(finalUrl, options);
    }

    private extractListModel(res: Response, pageIndex: number): SearchModel {

        let model = new SearchModel();
        if (res.json().query.results) {

            let result = res.json().query.results.postresult.json;

            model.pages = parseInt(result.pagecount);
            model.pageIndex = pageIndex - 1;


            result.recipes.forEach(element => {
                let item = new SearchItemModel();
                item.image = element.picture_link;
                item.text = element.title;
                item.link = element.link,
                    item.stars = parseInt(element.percent_rating);

                if (item.image == null || item.image.length <= 0) {
                    item.image = "http://de.cdn.community.thermomix.com/sites/all/themes/frontend/thermomix/images/nopicture_rectangle.png";
                } else {
                    item.image = "https://de.facebook.community.thermomix.com/" + item.image;
                }

                model.items.push(item);
            });
        }

        return model;
    }

    private extractDetailModel(res: Response, url: string): DetailModel {

        let jsonResult = res.json();

        if (jsonResult.results.length > 0) {

            let model = new DetailModel();
            let newHTMLDocument = document.implementation.createHTMLDocument("results");
            let baseElement = newHTMLDocument.createElement("div");
    
            baseElement.innerHTML = jsonResult.results[0];

            model.load(baseElement, url);

            // Cleanup
            baseElement.innerHTML = "";
            baseElement = null;
            newHTMLDocument = null;
            return model;
        }
    
        return null;
    }

    private extractRecipeOfToday(res: Response): SearchItemModel {

        let model = new SearchItemModel();
        let jsonResult = res.json();

        if (jsonResult.results.length > 0) {

            let newHTMLDocument = document.implementation.createHTMLDocument("results");
            let baseElement = newHTMLDocument.createElement("div");
            baseElement.innerHTML = jsonResult.results[0].replace("<pre/>", "");
    
    
            let $baseElement = jQuery(baseElement);
    
            const imageSelector = ".photo .image";
            const linkSelector = ".blocktitlelink";
            const titleSelector = ".title"
    
            model.image = Parser.getAttributeValue($baseElement, imageSelector, "src")
            model.link = Parser.getAttributeValue($baseElement, linkSelector, "href");
            model.text = Parser.getText($baseElement, titleSelector);
            model.stars = $baseElement.find(".stars .star.yellow").length;

            if (model.image == null || model.image.length <= 0) {
                model.image = "http://de.cdn.community.thermomix.com/sites/all/themes/frontend/thermomix/images/nopicture_rectangle.png";
            } else {
                model.image = "https://de.facebook.community.thermomix.com/" + model.image;
            }

            // Cleanup
            baseElement.innerHTML = "";
            baseElement = null;
            newHTMLDocument = null;
        }
        return model;
    }

}
