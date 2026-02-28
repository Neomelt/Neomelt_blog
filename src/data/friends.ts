export interface FriendLink {
    name: string;
    url: string;
    description: string;
    avatar?: string;
    rss?: string;
    tags?: string[];
}

export const FRIEND_LINKS: FriendLink[] = [
    {
        name: "Axi's Blog",
        url: "https://axi404.top",
        description: "一只可爱小猫",
        avatar: "https://axi404.top/avatar/avatar.png",
        rss: "https://axi404.top/rss.xml",
        tags: ["技术", "生活", "思考"],
    },
    {
        name: "YuxBao",
        url: "https://yux-bao.site",
        description: "一程山水，一念清欢",
        avatar: "https://yux-bao.site/avatar.webp",
    },
    {
        name: "game-life04",
        url: "https://game-life04.github.io/",
        description: "ICPC选手 | 医疗AI探索者",
        avatar: "https://game-life04.github.io/img/avatar.png",
    },
];
