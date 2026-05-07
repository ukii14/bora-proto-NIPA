# import bson
# import pymongo
# import datetime
# from pathlib import Path
# from db_model.mongodb import conn_mongodb
# from flask_login import UserMixin
# from crawling.capture import capture_screenshot

# class User(UserMixin):

#     def __init__(self, user_id: bson.objectid.ObjectId, web_link: str, title: str):
#         self.id = user_id
#         self.web_link = web_link
#         self.title = title


#     def get_id(self):
#         return str(self.id)


#     @staticmethod
#     def get(title):
#         mongo_db = conn_mongodb()

#         user = list(mongo_db.find({"title": title}, {"_id": 1, "title": 1, "web_link": 1})) ## list-like
#         if not user:
#             return None

#         user = user[0]
#         user = User(user_id = user["_id"], web_link = user["web_link"], title = user["title"])
#         return user


#     @staticmethod
#     def get_all(max_allow: int = 100):
#         mongo_db = conn_mongodb()
#         users = list(mongo_db.find({}).sort("cTime", pymongo.DESCENDING).limit(max_allow)) ## Max Allow size
#         if not users:
#             return None
        
#         return users


#     @staticmethod
#     def create(web_link: str, title: str):
#         user = User.get(title)
#         if user == None:
#             mongo_db = conn_mongodb()
#             mongo_db.insert_one({
#                 "title": title,
#                 "web_link": web_link,
#                 "cTime": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
#                 "save_path": capture_screenshot(web_link, title), ## save the path
#             })
#             # return User.get(title)
#         else:
#             # return user
#             pass

#         ## No Returns...


#     @staticmethod
#     def delete_all(asset_path = "./static/assets"):
#         ## Delete from db.
#         mongo_db = conn_mongodb()
#         mongo_db.delete_many({})

#         ## Delete from assets. (png)
#         for img in Path(asset_path).glob("*.png"):
#             img.unlink()
