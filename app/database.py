from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

DATABASE_URL = "mysql+mysqlconnector://root:nhan1811@127.0.0.1:3306/HTDKL"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit =False , autoflush= False , bind= engine)
Base = declarative_base()

#Dependency de lay DB trong moi request
def get_db():
    db = SessionLocal()
    try:
        yield
    finally:
        db.close()
