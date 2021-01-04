import argparse
import requests
from io import BytesIO

from google.cloud import vision
from PIL import Image, ImageDraw


def draw_boxes(image, bounds, color):
    '''
    Draws borders around the blocks of text

    image:
        vision.Image() object
    bounds:
        list of box coordinates from get_text_bounds()
    color:
        https://pillow.readthedocs.io/en/stable/reference/ImageColor.html#color-names
    
    Return: modified image
    '''
    draw = ImageDraw.Draw(image)

    for bound in bounds:
        draw.polygon([
            bound.vertices[0].x, bound.vertices[0].y,
            bound.vertices[1].x, bound.vertices[1].y,
            bound.vertices[2].x, bound.vertices[2].y,
            bound.vertices[3].x, bound.vertices[3].y], None, color)
    return image


def get_text_bounds(image_url):
    '''
    Uses google cloud vision api to grab text and bounds.

    image_url:
        image url to detect text from

    Return: list of box coordinates and corresponding text
    '''
    client = vision.ImageAnnotatorClient()

    box_text = []
    bounds = []

    image = vision.Image()
    image.source.image_uri = image_url
     
    response = client.document_text_detection(image=image)
    document = response.full_text_annotation


    for page in document.pages:
        for block in page.blocks:
            for paragraph in block.paragraphs:
                # Build paragraph text
                paragraph_text = []
                for word in paragraph.words:
                    for symbol in word.symbols:
                        paragraph_text.append(symbol.text)

                box_text.append("".join(paragraph_text))
                print("".join(paragraph_text))

                # Add bounds to draw
                bounds.append(paragraph.bounding_box)

    return bounds, box_text


def render_doc_text(url, fileout):
    response = requests.get(url)
    image = Image.open(BytesIO(response.content))

    bounds, text = get_text_bounds(url)
    draw_boxes(image, bounds, (204,204,255))

    if fileout != 0:
        image.save('./images/' + fileout)
    else:
        image.show()


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('image_url', help='The image url for text detection.')
    parser.add_argument('-out_file', help='Optional output file', default=0)
    args = parser.parse_args()

    render_doc_text(args.image_url, args.out_file)