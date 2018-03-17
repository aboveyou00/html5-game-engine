

export const simpleSprite = { src: 'blah' };
export const tiledSprite = {
    src: 'blah',
    tileset: {
        width: 32,
        height: 32,
        tilex: 1,
        tiley: 1
    }
};
export const animatedSprite = {
    src: 'blah',
    tileset: {
        width: 32,
        height: 32
    },
    frames: [
        { tilex: 0, tiley: 0 },
        { tilex: 1, tiley: 0 },
        { tilex: 2, tiley: 0 }
    ]
};
