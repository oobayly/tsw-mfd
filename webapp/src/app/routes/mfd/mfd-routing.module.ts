import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { Br406Component } from "./components/br406/br406.component";

const routes: Routes = [
  {
    path: "",
    children: [
      {
        path: "br406",
        component: Br406Component,
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MfdRoutingModule { }
