import cv2 as cv
import numpy as np
from matplotlib import pyplot as plt

# Load the image
image = cv.imread('image6_addidasTshirt.webp')
gray = cv.cvtColor(image, cv.COLOR_BGR2GRAY)

# Initialize HOG descriptor with the default pre-trained people detector
hog = cv.HOGDescriptor()
hog.setSVMDetector(cv.HOGDescriptor_getDefaultPeopleDetector())

# Detect people in the image
# Parameters: scale factor, window stride size, padding size, and threshold
rects, weights = hog.detectMultiScale(gray, winStride=(8, 8), padding=(8, 8), scale=1.05)

# Draw bounding boxes for detected people
for (x, y, w, h) in rects:
    cv.rectangle(image, (x, y), (x + w, y + h), (0, 255, 0), 2)

# Display the result
plt.imshow(cv.cvtColor(image, cv.COLOR_BGR2RGB))
plt.show()
