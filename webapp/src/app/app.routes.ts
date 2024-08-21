import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: "map",
    loadChildren: () => import("./routes/map/map.module").then((m) => m.MapModule),
  },
  {
    path: "mfd",
    loadChildren: () => import("./routes/mfd/mfd.module").then((m) => m.MfdModule),
  }
];
