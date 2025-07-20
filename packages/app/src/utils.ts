export const capitalize = (input: string) =>
    `${input.at(0)?.toUpperCase()}${input.substring(1)}`;

export const getSvgBoundingBox = (svg: string) => {
    const el = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    el.setAttribute(
        "style",
        "width:0!important; height:0!important; position:fixed!important; overflow:hidden!important; visibility:hidden!important; opacity:0!important",
    );
    el.innerHTML = svg;
    document.body.append(el);
    const { width, height } = el.getBBox();
    document.body.removeChild(el);
    return {
        width,
        height,
    };
};

export const download = (data: BlobPart, name: string) => {
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([data], { type: "text/plain" }));
    link.download = name;
    link.click();
}