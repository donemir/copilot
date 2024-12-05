export const getFaviconUrl = (url) => {
    try {
        const domain = new URL(url).hostname;
        return `https://www.google.com/s2/favicons?domain=${domain}`;
    } catch (error) {
        console.error("Invalid URL");
        return "";
    }
};
