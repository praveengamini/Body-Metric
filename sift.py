import numpy as np
import cv2 as cv
img = cv.imread('image6_addidasTshirt.webp')
gray= cv.cvtColor(img,cv.COLOR_BGR2GRAY)
sift = cv.SIFT_create()
kp = sift.detect(gray,None)
img=cv.drawKeypoints(gray,kp,img)
cv.imshow('img',img)
cv.imwrite('sift_keypoints.jpg',img)
if cv.waitKey(0) & 0xff == 27:
    cv.destroyAllWindows()w