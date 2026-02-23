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
];
