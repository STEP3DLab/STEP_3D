export const STAGE_REQUEST_TYPE = "Сцена / костюм / экспозиция";

export const projectFilters = ["Все", "Скульптуры", "Интерьеры", "Сцена и костюм", "Награды", "Макеты"] as const;
export type ProjectFilter = (typeof projectFilters)[number];

export type ProjectRoute = {
  filter: Exclude<ProjectFilter, "Все">;
  serviceHref: string;
  serviceLabel: string;
  requestType: string;
  materials: string;
};

export const portfolioOrder: readonly string[] = [
  "parshin-sculptures",
  "sakharov-art",
  "pletneva-costume",
  "rto-traveling-cup",
  "std-award",
  "astronomer",
  "crown",
  "mosque",
  "mask",
  "award",
  "red7-art",
];

const sculptureRoute: ProjectRoute = {
  filter: "Скульптуры",
  serviceHref: "/services/sculptures",
  serviceLabel: "Скульптуры и арт-объекты",
  requestType: "Скульптура / арт-объект",
  materials: "Идею, эскиз или фотографии, желаемый размер, место размещения и характер поверхности.",
};

const interiorRoute: ProjectRoute = {
  filter: "Интерьеры",
  serviceHref: "/services/decor-installations",
  serviceLabel: "Объекты для пространства",
  requestType: "Декор / инсталляция",
  materials: "Референсы, фото и размеры пространства, ограничения по весу и креплениям, дату готовности.",
};

const stageRoute: ProjectRoute = {
  filter: "Сцена и костюм",
  serviceHref: "/services/stage-objects",
  serviceLabel: "Сцена и костюм",
  requestType: STAGE_REQUEST_TYPE,
  materials: "Эскиз образа или референсы, размеры или мерки, движения на сцене, дату события и условия перевозки.",
};

const awardRoute: ProjectRoute = {
  filter: "Награды",
  serviceHref: "/services/awards",
  serviceLabel: "Авторские награды",
  requestType: "Кубок / награда",
  materials: "Идею и дату события, количество наград, примерный размер, референсы и пожелания по персонализации.",
};

const projectRoutes: Readonly<Record<string, ProjectRoute>> = {
  astronomer: sculptureRoute,
  "parshin-sculptures": sculptureRoute,
  "sakharov-art": interiorRoute,
  "pletneva-costume": stageRoute,
  "rto-traveling-cup": awardRoute,
  "std-award": awardRoute,
  "red7-art": interiorRoute,
  crown: stageRoute,
  award: awardRoute,
  mosque: {
    filter: "Макеты",
    serviceHref: "/services/3d-modeling",
    serviceLabel: "Цифровая форма",
    requestType: "Реплика / миниатюра",
    materials: "Чертежи, модель или фотографии объекта, нужный масштаб, ключевые детали и назначение макета.",
  },
  mask: stageRoute,
};

export function getProjectRoute(slug: string): ProjectRoute {
  const route = projectRoutes[slug];
  if (!route) throw new Error(`Project route is not configured: ${slug}`);
  return route;
}

export function getProjectBriefHref(slug: string, source = `case_${slug}`): string {
  const route = getProjectRoute(slug);
  const params = new URLSearchParams({
    type: route.requestType,
    case: slug,
    step: "2",
    source,
  });
  return `/?${params.toString()}#request`;
}

const portfolioRank = new Map(portfolioOrder.map((slug, index) => [slug, index]));

export function sortPortfolio<T extends { slug: string }>(items: readonly T[]): T[] {
  return [...items].sort((a, b) =>
    (portfolioRank.get(a.slug) ?? Number.MAX_SAFE_INTEGER) -
    (portfolioRank.get(b.slug) ?? Number.MAX_SAFE_INTEGER),
  );
}
