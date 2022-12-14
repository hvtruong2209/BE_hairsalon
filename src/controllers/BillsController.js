const variable = require("../common/variable");
const billsService = require("../services/BillsService");
class BillsController {
  async getBillById(req, res) {
    const id = parseInt(req.params.id);
    try {
      const bill = await billsService.getBillById(id);
      if (!bill) return res.status(variable.NoContent).send();
      res.send(bill);
    } catch (err) {
      res.status(variable.InternalServerError).send(err.message);
    }
  }

  async getListBillsByFilter(req, res) {
    try {
      const listBills = await billsService.getListBillsByFilter(req.query);
      if (listBills.length === 0) return res.status(variable.NoContent).send();
      var obj = {
        bills: listBills,
      };
      let pageSize = req.query.pageSize;
      if (pageSize) {
        delete req.query.pageSize;
        delete req.query.page;
        const len = await billsService.getListBillsByFilter(req.query);
        obj.totalPage =
          len.length % pageSize == 0
            ? len.length / pageSize
            : Math.floor(len.length / pageSize) + 1;
      }
      res.send(obj);
    } catch (err) {
      res.status(variable.InternalServerError).send(err.message);
    }
  }

  async createBill(req, res) {
    const date = new Date();
    date.setHours(date.getHours() + 7);
    const serviceArray = req.body.serviceArray;
    const serviceArrayMap = serviceArray?.map(
      (item) => new Object({ serviceId: item })
    );
    const dataWithoutBooking = {
      createdAt: date,
      updatedAt: date,
      createdBy: parseInt(req.user.Id),
      price: parseInt(req.body.price), // price has discount
      staffId: parseInt(req.body.staffId),
      phone: req.body.phone,
      details: {
        create: serviceArrayMap,
      },
    };
    try {
      const data = dataWithoutBooking;
      const result = await billsService.createBill(data);
      res.send(result);
    } catch (err) {
      res.status(variable.BadRequest).send(err.message);
    }
  }

  async createBillWithBooking(req, res) {
    const date = new Date();
    date.setHours(date.getHours() + 7);
    const dataWithBooking = {
      createdAt: date,
      updatedAt: date,
      createdBy: parseInt(req.user.Id),
      price: parseInt(req.body.price), // price has discount
      staffId: parseInt(req.body.staffId),
      customerId: parseInt(req.body.customerId),
      bookingId: parseInt(req.body.bookingId),
    };
    try {
      const data = dataWithBooking;
      const result = await billsService.createBillWithBooking(data);
      if (result === variable.BadRequest)
        return res
          .status(variable.BadRequest)
          .send("This booking is not confirmed");
      res.send(result);
    } catch (err) {
      res.status(variable.BadRequest).send(err.message);
    }
  }

  async deleteBill(req, res) {
    try {
      let id = parseInt(req.params.id);
      let roleIdAuth = req.user.roleId;
      if (
        roleIdAuth &&
        roleIdAuth != variable.ReceptionistRoleId &&
        roleIdAuth != variable.AdminRoleId
      )
        return res
          .status(variable.BadRequest)
          .send("No permission! Only works for receptionist accounts");
      await billsService.deleteBill(id);

      res.send("Delete Booking successful!");
    } catch (err) {
      if (err.code === "P2025") {
        return res.status(variable.BadRequest).send(err.meta.cause);
      }
      res.status(variable.InternalServerError).send(err.message);
    }
  }
  async getStaffsOrderByBills(req, res) {
    try {
      const billsOrderBy = await billsService.getStaffsOrderByBills(req.query);
      res.send(billsOrderBy);
    } catch (err) {
      res.status(variable.InternalServerError).send(err.message);
    }
  }

  async getProfitEachMonth(req, res) {
    try {
      const year = req.query.year;
      const profits = await billsService.getProfitEachMonth(parseInt(year));
      res.send(profits);
    } catch (err) {
      res.status(variable.InternalServerError).send(err.message);
    }
  }
}
module.exports = new BillsController();
